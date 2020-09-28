const imagemin = require('gulp-imagemin')

module.exports = function mediaOptimizer(media, imageminPlugins) {
    return imagemin([
        imagemin.gifsicle(media && media.gif ? media.gif : {interlaced: true}),
        imagemin.mozjpeg(media && media.jpg ? media.jpg : {progressive: true}),
        imagemin.optipng(media && media.png ? media.png : {optimizationLevel: 5}),
        imagemin.svgo(media && media.svg ? media.svg : {
            plugins: [
                {
                    removeViewBox: false,
                    collapseGroups: true,
                },
            ],
        }),
        ...(imageminPlugins ? imageminPlugins(imagemin) : []),
    ])
}
