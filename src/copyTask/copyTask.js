import gulp from 'gulp'
import gulpCopy from 'gulp-copy'

export function makeCopyTask({copyPaths, dist, browsersync}) {
    function makeCopyTasks(copyInfo) {
        return function copy() {
            return gulp
                .src(copyInfo.src)
                .pipe(browsersync.stream())
                .pipe(gulpCopy(dist, {prefix: copyInfo.prefix}))
        }
    }

    return {
        watch: (watchOptions) => {
            if(copyPaths) {
                let copies = copyPaths
                if(!Array.isArray(copies)) {
                    copies = [copies]
                }
                copies.forEach(copyOne => {
                    // todo: add something like "sync-the-files" instead of copy for watch
                    gulp.watch(copyOne.src, watchOptions, makeCopyTasks(copyOne))
                })
            }
        },
        build: copyPaths ?
            [
                Array.isArray(copyPaths) ?
                    copyPaths.map(copySingle => (
                        makeCopyTasks(copySingle)
                    )) :
                    makeCopyTasks(copyPaths),
            ] :
            [],
    }
}
