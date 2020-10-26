const path = require('path')
const {series, parallel, ...gulp} = require('gulp')
const logger = require('gulplog')
const colors = require('colors/safe')
const {subpipe} = require('../subpipe')

function cssHandler(
    done, outputStyle = 'nested', options = {},
    postImport = true, postPrefix = true, postNano = true,
) {
    const autoprefixer = require('autoprefixer')
    const postcssImport = require('postcss-import')
    const cssnano = require('cssnano')
    const postcss = require('gulp-postcss')
    const sass = require('gulp-sass')
    const tildeImporter = require('node-sass-tilde-importer')
    const replace = require('gulp-replace')
    const plumber = require('gulp-plumber')

    return subpipe((stream) => {
        return stream.pipe(plumber({
                errorHandler: function(error) {
                    logger.error(colors.red('Error in css build:') + '\n' + error.message)
                    if(process.env.NODE_ENV === 'production') throw error
                    done()
                },
            }))
            .pipe(sass({
                outputStyle: outputStyle,
                importer: tildeImporter,
                ...options,
            }))
            .pipe(postcss([
                ...(postImport ? [postcssImport()] : []),
                ...(postPrefix ? [autoprefixer()] : []),
                ...(postNano ? [cssnano()] : []),
            ]))
            .pipe(replace('@charset "UTF-8";', ''))
    })
}

exports.cssHandler = cssHandler

function makeCssTask(paths, browsersync, outputStyle, options) {
    return function gulpCss(done) {
        return gulp
            .src(paths.styles + '/**/*.{scss,sass}')
            .pipe(cssHandler(done, outputStyle, options))
            .pipe(gulp.dest(path.join(paths.dist, paths.distStyles)))
            .pipe(browsersync.stream())
    }
}

exports.makeCssTask = makeCssTask
