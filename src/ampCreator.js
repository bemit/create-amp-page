'use strict'
// system
const path = require('path')
const colors = require('colors/safe')
// General
const {series, parallel, ...gulp} = require('gulp')
const logger = require('gulplog')
const gulpCopy = require('gulp-copy')
const del = require('del')
const replace = require('gulp-replace')
const plumber = require('gulp-plumber')
// create-amp-page internals
const {getOptions} = require('./AmpCreatorOptions')
const {twigDataHandler} = require('./twigDataHandler')
const {twigMultiLoad, twigMultiSave} = require('./twigMultiRenderer')
const {ampOptimizer} = require('./ampOptimizer')
const {cleanHtmlCss} = require('./cleanHtmlCss')
const {injectCSS} = require('./injectCSS')
// Sass / CSS
const autoprefixer = require('autoprefixer')
const postcssImport = require('postcss-import')
const cssnano = require('cssnano')
const postcss = require('gulp-postcss')
const sass = require('gulp-sass')
const tildeImporter = require('node-sass-tilde-importer')
// Static Server
const browsersync = require('browser-sync').create()
const historyApiFallback = require('connect-history-api-fallback')
// Image
const imagemin = require('gulp-imagemin')
const newer = require('gulp-newer')
// Template Rendering
const twigGulp = require('gulp-twig')

module.exports = function(options) {
    const {
        paths,
        port,
        prettyUrlExtensions,
        historyFallback,
        serveStaticMiddleware = [],
        twig,
        watchFolders = {
            sass: [],
            twig: [],
            media: [],
        },
        watchOverride,
        cleanFolders = [],
        ampOptimize,
        minifyHtml,
        cleanInlineCSS,
        cleanInlineCSSWhitelist,
        cssInjectTag,
        collections,
    } = getOptions(options)

    function browserSync(done) {
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
                    ...(historyFallback ? [historyApiFallback({
                        index: historyFallback,
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

    function copyFactory(copyInfo) {
        return function copy() {
            return gulp
                .src(copyInfo.src)
                .pipe(browsersync.stream())
                .pipe(gulpCopy(paths.dist, {prefix: copyInfo.prefix}))
        }
    }

    function imagesFactory() {
        return function images() {
            return gulp
                .src(paths.media + '/**/*')
                .pipe(newer(paths.dist + '/' + paths.distMedia))
                .pipe(
                    imagemin([
                        imagemin.gifsicle({interlaced: true}),
                        imagemin.mozjpeg({progressive: true}),
                        imagemin.optipng({optimizationLevel: 5}),
                        imagemin.svgo({
                            plugins: [
                                {
                                    removeViewBox: false,
                                    collapseGroups: true,
                                },
                            ],
                        }),
                    ]),
                )
                .pipe(gulp.dest(paths.dist + '/' + paths.distMedia))
                .pipe(browsersync.stream())
        }
    }

    function cssFactory(fail = true) {
        return function css(done) {
            return gulp
                .src(paths.styles + '/**/*.{scss,sass}')
                .pipe(plumber({
                    errorHandler: function(error) {
                        logger.error(colors.red('Error in css build:') + '\n' + error.message)
                        if(fail) throw error
                        done()
                    },
                }))
                .pipe(sass({
                    outputStyle: 'expanded',
                    importer: tildeImporter,
                }))
                .pipe(gulp.dest(paths.dist + '/' + paths.distStyles))
                .pipe(postcss([postcssImport(), autoprefixer(), cssnano()]))
                .pipe(replace('@charset "UTF-8";', ''))
                .pipe(gulp.dest(paths.dist + '/' + paths.distStyles))
                .pipe(browsersync.stream())
        }
    }

    function htmlFactory(failOnSize = true) {

        // share twig logic for `twig-as-entrypoint` and `frontmatter-as-entrypoint` (collections)
        const twigHandler = (task) => {
            return task.pipe(twigGulp({
                    base: paths.html,
                    trace: twig && twig.trace,
                    extend: twig && twig.extend,
                    functions: twig && twig.functions,
                    filters: twig && twig.filters,
                }))
                // // middlewares after twig compilation
                // // middlewares for style injection
                .pipe(injectCSS({paths, failOnSize, injectTag: cssInjectTag}))
                // // middlewares after CSS injection
                .pipe(cleanHtmlCss({
                    minifyHtml,
                    cleanInlineCSS,
                    cleanInlineCSSWhitelist,
                }))
                .pipe(ampOptimizer(ampOptimize))
        }

        const htmlTasks = []
        htmlTasks.push(function html() {
            return twigHandler(
                gulp.src(paths.htmlPages + '/*.twig')
                    .pipe(twigDataHandler(twig)),
            )
                .pipe(gulp.dest(paths.dist))
                .pipe(browsersync.stream())
        })

        if(collections && Array.isArray(collections)) {
            collections.forEach(collection => {
                htmlTasks.push(function htmlCollection() {
                    return twigHandler(
                        gulp.src(collection.data)
                            .pipe(twigMultiLoad(
                                {
                                    ...twig,
                                    ...(collection.fmMap ? {fmMap: collection.fmMap} : {}),
                                    ...(collection.customMerge ? {customMerge: collection.customMerge} : {}),
                                },
                                collection.tpl,
                            )),
                    )
                        .pipe(twigMultiSave(collection.ext))
                        .pipe(gulp.dest(path.join(paths.dist, collection.base)))
                        .pipe(browsersync.stream())
                })
            })
        }
        return parallel(...htmlTasks)
    }

    function watchFiles() {
        gulp.watch([paths.styles + '/**/*.(scss|sass)', ...watchFolders.sass], {ignoreInitial: false},
            // only when the stylesheet should be injected, HTML must be build after CSS
            paths.stylesInject ? series(cssFactory(false), htmlFactory(false)) : cssFactory(false),
        )
        gulp.watch([paths.html + '/**/*.twig', ...watchFolders.twig], {ignoreInitial: false}, htmlFactory(false))
        gulp.watch([paths.media + '/**/*', ...watchFolders.media], {ignoreInitial: false}, imagesFactory())

        if(paths.copy) {
            let copies = paths.copy
            if(!Array.isArray(copies)) {
                copies = [copies]
            }
            copies.forEach(copyOne => {
                // todo: add something like "sync-the-files" instead of copy for watch
                gulp.watch(copyOne.src, {ignoreInitial: false}, copyFactory(copyOne))
            })
        }
    }

    const build =
        series(clean,
            parallel(
                ...(paths.copy ?
                    [Array.isArray(paths.copy) ?
                        paths.copy.map(copySingle => (
                            copyFactory(copySingle)
                        )) :
                        copyFactory(paths.copy)] :
                    []),
                series(
                    cssFactory(true),
                    parallel(htmlFactory(true), imagesFactory()),
                ),
            ),
        )
    const watch = series(clean, parallel(watchOverride ? watchOverride(gulp, {cssFactory, htmlFactory, imagesFactory}) : watchFiles, browserSync))

    return {
        images: imagesFactory(),
        clean,
        build,
        watch,
    }
}
