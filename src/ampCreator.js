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
        dist,
        historyFallback,
        // browsersync
        port, open, startPath,
        prettyUrlExtensions, serveStaticMiddleware,
        // clean
        cleanFolders,
        // html / twig
        twig,
        ampOptimizer,
        minifyHtml, minifyHtmlOptions,
        cleanInlineCSS, cleanInlineCSSOptions,
        cleanInlineCSSWhitelist,
        cssInjectTag,
        cssFailOnSize, cssSizeLimit,
        pages,
        collections,
        // media
        srcMedia, distMedia,
        media, imageminPlugins,
        // watch
        watchFolders,
        watchOptions,
    } = options

    if(!pages) {
        throw new Error('ampCreator missing `pages`')
    }

    const pageIds = Object.keys(pages)

    if(pageIds.includes('media')) {
        throw new Error('Page with id `media` found, reserved name.')
    }

    function browserSyncSetup(done) {
        browsersync.init({
            port: port,
            open: !!open,
            notify: true,
            ghostMode: false,
            startPath: typeof open === 'string' ? open : undefined,
            //single: true,
            server: {
                baseDir: dist,
                serveStaticOptions: {
                    extensions: prettyUrlExtensions,
                },
                middleware: [
                    ...(historyFallback ? [historyApiFallback({
                        index: historyFallback,
                    })] : []),
                    ...serveStaticMiddleware,
                ],
            },
        })
        done()
    }

    function clean() {
        return del([dist, ...cleanFolders])
    }

    const gulpCss = parallel(
        pageIds.filter(pageId => pages[pageId].paths.styles)
            .map(pageId => makeCssTask(pages[pageId].paths, browsersync)),
    )
    const gulpHtml = parallel(
        pageIds.filter(pageId => pages[pageId].paths.styles)
            .map(pageId =>
                makeHtmlTask({
                    paths: pages[pageId].paths,
                    srcMedia, distMedia,
                    dist,
                    twig,
                    ampOptimizer,
                    minifyHtml, minifyHtmlOptions,
                    imageminPlugins,
                    cleanInlineCSS, cleanInlineCSSOptions,
                    cleanInlineCSSWhitelist,
                    cssInjectTag,
                    cssFailOnSize, cssSizeLimit,
                    collections: collections.filter(collection => collection.pageId === pageId || !collection.pageId),
                    browsersync,
                }),
            ),
    )
    const gulpMedia = makeMediaTask({
        paths: {
            media: srcMedia,
            distMedia,
            dist: dist,
        },
        media,
        imageminPlugins,
        browsersync,
    })

    const gulpCopyTasks =
        pageIds.filter(pageId => pages[pageId].paths.copy)
            .map(pageId =>
                makeCopyTask({
                    copyPaths: pages[pageId].paths.copy,
                    dist: pages[pageId].paths.dist,
                    browsersync,
                }),
            )

    function gulpWatch() {
        pageIds.filter(pageId => pages[pageId].paths.copy)
            .forEach(pageId => {
                const paths = pages[pageId].paths
                // todo: merge all watch paths from pages to one watch group per "paths.<type>", de-duplicating same for e.g. `paths.html`

                if(paths.styles) {
                    gulp.watch([paths.styles + '/**/*.(scss|sass)', ...watchFolders.sass], watchOptions,
                        // only when the stylesheet should be injected, HTML must be build after CSS
                        paths.stylesInject ? series(gulpCss, gulpHtml) : gulpCss,
                    )
                }
                if(paths.html || watchFolders.twig.length > 0) {
                    gulp.watch(
                        [paths.html + '/**/*.twig', ...watchFolders.twig], watchOptions,
                        series(clearGetMediaCache, gulpHtml),
                    )
                }
            })
        gulp.watch(
            [srcMedia + '/**/*', ...watchFolders.media], watchOptions, gulpMedia,
        )
        gulpCopyTasks.forEach(copyTask => {
            copyTask.watch(watchOptions)
        })
    }

    const builder = parallel(
        ...gulpCopyTasks.map(copyTask => copyTask.build),
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
