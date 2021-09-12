import imagemin from 'gulp-imagemin'
import imageminGifsicle from 'imagemin-gifsicle'
import imageminOptipng from 'imagemin-optipng'
import imageminMozjpeg from 'imagemin-mozjpeg'
import imageminSvgo from 'imagemin-svgo'

export function mediaOptimizer(media, imageminPlugins) {
    return imagemin([
        imageminGifsicle(media && media.gif ? media.gif : {interlaced: true}),
        imageminMozjpeg(media && media.jpg ? media.jpg : {progressive: true}),
        imageminOptipng(media && media.png ? media.png : {optimizationLevel: 5}),
        imageminSvgo(media && media.svg ? media.svg : {
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
