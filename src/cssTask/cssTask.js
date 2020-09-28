const path = require('path')
const {series, parallel, ...gulp} = require('gulp')
const logger = require('gulplog')
const colors = require('colors/safe')

function cssHandler(stream, done) {
    const autoprefixer = require('autoprefixer')
    const postcssImport = require('postcss-import')
    const cssnano = require('cssnano')
    const postcss = require('gulp-postcss')
    const sass = require('gulp-sass')
    const tildeImporter = require('node-sass-tilde-importer')
    const replace = require('gulp-replace')
    const plumber = require('gulp-plumber')

    return stream.pipe(plumber({
            errorHandler: function(error) {
                logger.error(colors.red('Error in css build:') + '\n' + error.message)
                if(process.env.NODE_ENV === 'production') throw error
                done()
            },
        }))
        .pipe(sass({
            outputStyle: 'expanded',
            importer: tildeImporter,
        }))
        .pipe(postcss([postcssImport(), autoprefixer(), cssnano()]))
        .pipe(replace('@charset "UTF-8";', ''))
}

function cssTask(paths, browsersync) {
    return function gulpCss(done) {
        return cssHandler(
            gulp
                .src(paths.styles + '/**/*.{scss,sass}'),
            done,
        )
            .pipe(gulp.dest(path.join(paths.dist, paths.distStyles)))
            .pipe(browsersync.stream())
    }
}

module.exports = cssTask
