import path from 'path'
import gulpBase from 'gulp'
import logger from 'gulplog'
import colors from 'colors/safe.js'
import {subpipe} from '../subpipe.js'
import autoprefixer from 'autoprefixer'
import postcssImport from 'postcss-import'
import cssnano from 'cssnano'
import postcss from 'gulp-postcss'
import sass from 'gulp-sass'
import nodeSass from 'node-sass'
import tildeImporter from 'node-sass-tilde-importer'
import replace from 'gulp-replace'
import plumber from 'gulp-plumber'

const {parallel, series, ...gulp} = gulpBase

const sassCompiler = sass(nodeSass)

export function cssHandler(
    done, outputStyle = 'nested', options = {},
    postImport = true, postPrefix = true, postNano = true,
) {
    return subpipe((stream) => {
        return stream.pipe(plumber({
                errorHandler: function(error) {
                    logger.error(colors.red('Error in css build:') + '\n' + error.message)
                    if(process.env.NODE_ENV === 'production') throw error
                    done()
                },
            }))
            .pipe(sassCompiler({
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

export function makeCssTask(paths, browsersync, outputStyle, options) {
    return function gulpCss(done) {
        return gulp
            .src(paths.styles + '/**/*.{scss,sass}')
            .pipe(cssHandler(done, outputStyle, options))
            .pipe(gulp.dest(path.join(paths.dist, paths.distStyles)))
            .pipe(browsersync.stream())
    }
}
