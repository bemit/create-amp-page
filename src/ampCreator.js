'use strict'
// system
const fs = require('fs')
const colors = require('colors/safe')
// General
const {series, parallel, ...gulp} = require('gulp')
const logger = require('gulplog')
const gulpCopy = require('gulp-copy')
const del = require('del')
const replace = require('gulp-replace')
const plumber = require('gulp-plumber')
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
const data = require('gulp-data')
const fm = require('front-matter')

module.exports = function({
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
                          }) {
    const watchFoldersSass = watchFolders.sass || []
    const watchFoldersTwig = watchFolders.twig || []
    const watchFoldersMedia = watchFolders.media || []

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

    function htmlFactory(requireCss = true) {
        return function html() {
            return gulp.src(paths.htmlPages + '/*.twig')
                .pipe(data(function(file) {
                    let data = twig && twig.data ? twig.data : {}
                    if(twig && twig.json) {
                        if(twig.customMerge) {
                            data = this.customMerge(data, JSON.parse(fs.readFileSync(twig.json(file.path))))
                        } else {
                            data = {
                                ...data,
                                ...JSON.parse(fs.readFileSync(twig.json(file.path))),
                            }
                        }
                    }

                    if(twig && twig.fm && twig.fmMap) {
                        const content = fm(String(fs.readFileSync(twig.fm(file.path))))
                        //file.contents = Buffer.from(content.body)
                        if(twig.customMerge) {
                            data = this.customMerge(data, twig.fmMap(content, file.path))
                        } else {
                            data = {
                                ...data,
                                ...twig.fmMap(content, file.path),
                            }
                        }
                    }

                    return data
                }))
                .pipe(twigGulp({
                    base: paths.html,
                    trace: twig && twig.trace,
                    extend: twig && twig.extend,
                    functions: twig && twig.functions,
                    filters: twig && twig.filters,
                }))
                .pipe(replace(/style amp-custom>/, function() {
                    if(!paths.stylesInject) return 'style amp-custom>'

                    let style = ''
                    try {
                        style = fs.readFileSync(paths.dist + '/' + paths.distStyles + '/' + paths.stylesInject, 'utf8')
                        if(Buffer.byteLength(style, 'utf8') > 75000) {
                            logger.error(colors.red('Style Size: ' + (Buffer.byteLength(style, 'utf8')) + ' bytes'))
                            if(requireCss) throw new Error('css file exceeds amp limit of 75kb')
                        } else {
                            logger.info('Style Size: ' + (Buffer.byteLength(style, 'utf8')) + ' bytes')
                        }
                    } catch(err) {
                        if(requireCss || err.code !== 'ENOENT') {
                            // only throw if other error then file not-found
                            throw err
                        }
                    }
                    return 'style amp-custom>\n' + style + '\n'
                }))
                .pipe(gulp.dest(paths.dist))
                .pipe(browsersync.stream())
        }
    }

    function watchFiles() {
        gulp.watch([paths.styles + '/**/*.(scss|sass)', ...watchFoldersSass], {ignoreInitial: false},
            // only when the stylesheet should be injected, HTML must be build after CSS
            paths.stylesInject ? series(cssFactory(false), htmlFactory(false)) : cssFactory(false),
        )
        gulp.watch([paths.html + '/**/*.twig', ...watchFoldersTwig], {ignoreInitial: false}, htmlFactory(false))
        gulp.watch([paths.media + '/**/*', ...watchFoldersMedia], {ignoreInitial: false}, imagesFactory())

        let copies = paths.copy
        if(!Array.isArray(copies)) {
            copies = [copies]
        }
        copies.forEach(copyOne => {
            // todo: add something like "sync-the-files" instead of copy for watch
            gulp.watch(copyOne.src, {ignoreInitial: false}, copyFactory(copyOne))
        })
    }

    const build =
        series(clean,
            parallel(
                ...(paths.copy ? [Array.isArray(paths.copy) ? paths.copy.map(copySingle => (
                    copyFactory(copySingle)
                )) : copyFactory(paths.copy)] : []),
                series(
                    cssFactory(true),
                    parallel(htmlFactory(true), imagesFactory()),
                ),
            ),
        )
    const watch = parallel(watchOverride ? watchOverride(gulp, {cssFactory, htmlFactory, imagesFactory}) : watchFiles, browserSync)

    return {
        images: imagesFactory(),
        clean,
        build,
        watch,
    }
}
