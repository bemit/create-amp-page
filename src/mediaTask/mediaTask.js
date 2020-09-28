const path = require('path')
const newer = require('gulp-newer')
const gulp = require('gulp')
const mediaOptimizer = require('./mediaOptimizer')

function makeMediaTask({paths, media, imageminPlugins, browsersync}) {
    return function gulpMedia() {
        return gulp
            .src(paths.media + '/**/*')
            .pipe(newer(path.join(paths.dist, paths.distMedia)))
            .pipe(mediaOptimizer(media, imageminPlugins))
            .pipe(gulp.dest(path.join(paths.dist, paths.distMedia)))
            .pipe(browsersync.stream())
    }
}

module.exports = makeMediaTask
