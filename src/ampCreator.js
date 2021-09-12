// General
import gulp from 'gulp'
import del from 'del'
// create-amp-page internals
import {getOptions} from './AmpCreatorOptions.js'
// Static Server
import browsersyncCreator from 'browser-sync'
import historyApiFallback from 'connect-history-api-fallback'
// task factories
import {makeHtmlTask} from './htmlTask/index.js'
import {makeMediaTask} from './mediaTask/index.js'
import {makeCssTask} from './cssTask/index.js'
import {makeCopyTask} from './copyTask/index.js'
import {clearGetMediaCache} from './htmlTask/twigFnMedia.js'

const browsersync = browsersyncCreator.create()

const {series, parallel} = gulp

export function ampCreator(options, setup, wrap) {
    options = getOptions(options)

    if(setup) {
        options = setup(options)
    }

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
    } = options

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
        imageminPlugins,
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
            series(clearGetMediaCache, gulpHtml),
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
        css: gulpCss,
        html: gulpHtml,
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
