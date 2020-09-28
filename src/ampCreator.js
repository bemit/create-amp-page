'use strict'
// General
const gulp = require('gulp')
const del = require('del')
// create-amp-page internals
const {getOptions} = require('./AmpCreatorOptions')
// Static Server
const browsersync = require('browser-sync').create()
const historyApiFallback = require('connect-history-api-fallback')
// task factories
const {makeHtmlTask} = require('./htmlTask')
const {makeMediaTask} = require('./mediaTask')
const {makeCssTask} = require('./cssTask')
const {makeCopyTask} = require('./copyTask')

const {series, parallel} = gulp

module.exports = function(options, wrap) {

    const {
        paths,
        // browsersync
        port, prettyUrlExtensions, serveStaticMiddleware,
        // clean
        cleanFolders,
        // html / twig
        twig,
        ampOptimize,
        minifyHtml,
        cleanInlineCSS,
        cleanInlineCSSWhitelist,
        cssInjectTag,
        collections,
        // media
        media, imageminPlugins,
        // watch
        watchFolders,
        watchOptions,
    } = getOptions(options)

    function browserSyncSetup(done) {
        browsersync.init({
            open: false,
            notify: false,
            ghostMode: false,
            server: {
                baseDir: paths.dist,
                serveStaticOptions: {
                    extensions: prettyUrlExtensions,
                },
                middleware: [
                    ...(paths.historyFallback ? [historyApiFallback({
                        index: paths.historyFallback,
                    })] : []),
                    ...serveStaticMiddleware,
                ],
            },
            port: port,
        })
        done()
    }

    function clean() {
        return del([paths.dist, ...cleanFolders])
    }

    const gulpCss = makeCssTask(paths, browsersync)
    const gulpHtml = makeHtmlTask({
        paths, twig,
        ampOptimize,
        minifyHtml,
        cleanInlineCSS,
        cleanInlineCSSWhitelist,
        cssInjectTag,
        collections,
        browsersync,
    })
    const gulpMedia = makeMediaTask({paths, media, imageminPlugins, browsersync})
    const gulpCopyTasks = makeCopyTask({copyPaths: paths.copy, dist: paths.dist, browsersync})

    function gulpWatch() {
        gulp.watch([paths.styles + '/**/*.(scss|sass)', ...watchFolders.sass], watchOptions,
            // only when the stylesheet should be injected, HTML must be build after CSS
            paths.stylesInject ? series(gulpCss, gulpHtml) : gulpCss,
        )
        gulp.watch(
            [paths.html + '/**/*.twig', ...watchFolders.twig], watchOptions,
            series(require('./htmlTask/twigFunctions').clearGetImageCache, gulpHtml),
        )
        gulp.watch(
            [paths.media + '/**/*', ...watchFolders.media], watchOptions, gulpMedia,
        )

        gulpCopyTasks.watch(watchOptions)
    }

    const builder = parallel(
        gulpCopyTasks.build,
        series(
            gulpCss,
            parallel(gulpHtml, gulpMedia),
        ),
    )
    const build = series(
        clean,
        builder,
    )

    const watch = series(
        clean,
        parallel(gulpWatch, browserSyncSetup),
    )

    const tasks = {
        // deprecated: images task will be renamed in the future to `media`
        css: gulpCss,
        html: gulpHtml,
        images: gulpMedia,
        media: gulpMedia,
        clean,
        build,
        builder,
        watch,
        watcher: gulpWatch,
    }

    return wrap ?
        wrap(gulp, tasks, options, {gulpCopyTasks, makeHtmlTask, makeMediaTask, makeCssTask, makeCopyTask, browsersync, browserSyncSetup}) :
        tasks
}
