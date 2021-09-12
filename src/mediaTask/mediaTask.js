import path from 'path'
import newer from 'gulp-newer'
import gulp from 'gulp'
import {mediaOptimizer} from './mediaOptimizer.js'

export function makeMediaTask({paths, media, imageminPlugins, browsersync}) {
    return function gulpMedia() {
        return gulp
            .src(paths.media + '/**/*')
            .pipe(newer(path.join(paths.dist, paths.distMedia)))
            .pipe(mediaOptimizer(media, imageminPlugins))
            .pipe(gulp.dest(path.join(paths.dist, paths.distMedia)))
            .pipe(browsersync.stream())
    }
}
