import {imageSize} from 'image-size'
import path from 'path'
import gulp from 'gulp'
import logger from 'gulplog'
import crypto from 'crypto'
import fs from 'fs'
import through2 from 'through2'
import gulpRename from 'gulp-rename'
import {mediaOptimizer} from '../mediaTask/mediaOptimizer.js'
import sharp from 'sharp'

const getRelativeMediaPath = (src, distMedia) => src.replace(new RegExp(distMedia, 'i'), '')

const containsRelativeSize = (size) => size.indexOf('%') !== -1 || size.indexOf('vw') !== -1

export const {resizeUsedImages, getImage, clearGetMediaCache} = (() => {
    const imageRefs = {current: {}}

    const clearGetMediaCache = function clearGetMediaCache(done) {
        imageRefs.current = {}
        if(done) {
            done()
        }
    }

    const getImage = (mediaPath, distMedia) => ({
        name: 'getImage',
        func: (src, srcset) => {
            if(!imageRefs.current[src] || !imageRefs.current[src].hash) {
                let dimensions = {width: 0, height: 0}
                let hash
                try {
                    if(src.indexOf('//') !== -1) {
                        // absolute src, can not be handled
                        return undefined
                    }
                    const srcPath = path.join(mediaPath, getRelativeMediaPath(src, distMedia))
                    dimensions = imageSize(srcPath)
                    try {
                        const fileData = fs.readFileSync(srcPath)
                        hash = crypto.createHash('sha1').update(fileData).digest('base64')
                    } catch(e) {
                        throw e
                    }
                } catch(e) {
                    if(process.env.NODE_ENV !== 'production') {
                        console.warn('getImage', e)
                    } else {
                        console.error('getImage', e)
                        throw e
                    }
                }
                if(hash) {
                    imageRefs.current[src] = {
                        src,
                        width: dimensions.width,
                        height: dimensions.height,
                        hash,
                        srcset: {},
                    }
                }
            }
            if(imageRefs.current[src] && srcset) {
                if(Array.isArray(srcset)) {
                    srcset.forEach(set => {
                        if(set.w && !set.h) {
                            if(!containsRelativeSize(set.w)) {
                                imageRefs.current[src].srcset[set.w + 'w'] = {width: set.w}
                            }
                        } else if(!set.w && set.h) {
                            if(!containsRelativeSize(set.h)) {
                                imageRefs.current[src].srcset[set.h + 'h'] = {height: set.h}
                            }
                        } else if(set.w && set.h) {
                            if(!containsRelativeSize(set.w) && !containsRelativeSize(set.h)) {
                                imageRefs.current[src].srcset[set.h + 'w' + set.h + 'h'] = {width: set.w, height: set.h}
                            }
                        }
                    })
                } else {
                    logger.error('srcset is set, but no array at src `' + src + '`, it is typeof ' + (typeof srcset))
                }
            }
            return imageRefs.current[src]
        },
    })

    // not a twig function but used directly here to resize images after content processing
    const resizeUsedImages = ({media, dist, distMedia, imageminPlugins}) => function resizeUsedImages(done) {
        const resizer = []

        if(imageRefs.current) {
            Object.keys(imageRefs.current).forEach(imgSrc => {
                const img = imageRefs.current[imgSrc]
                // check for hash: only when image could be accessed
                if(img.hash && img.srcset) {
                    const aspect = (img.width / img.height)

                    const makeResizing = (width, height, suffix) => {
                        width = parseInt(width)
                        height = parseInt(height)
                        if(!width || !height || isNaN(width) || isNaN(height)) {
                            if(process.env.NODE_ENV !== 'production') {
                                console.warn('must-have-sizes')
                            } else {
                                throw ('must-have-sizes')
                            }
                        }

                        const srcPath = path.join(media, getRelativeMediaPath(img.src, distMedia))
                        const distFileName = addImageSuffixFn(getRelativeMediaPath(img.src, distMedia), suffix)
                        const distPath = path.join(dist, distMedia, distFileName)
                        if(fs.existsSync(distPath)) {
                            logger.info('File exists skipped: ' + distPath)
                            return Promise.resolve()
                        }

                        return new Promise((resolve, reject) => {
                            gulp
                                .on('error', err => {
                                    if(process.env.NODE_ENV !== 'production') {
                                        console.log(err)
                                        resolve()
                                    } else {
                                        reject(err)
                                    }
                                })
                                .src(srcPath)
                                .pipe(through2.obj(async(file, _, cb) => {
                                    if(file.isBuffer()) {
                                        sharp(file.contents)
                                            .resize(width, height)
                                            .toBuffer()
                                            .then((data) => {
                                                file.contents = data
                                                cb(null, file)
                                            })
                                            .catch((e) => {
                                                if(process.env.NODE_ENV !== 'production') {
                                                    console.warn(e)
                                                    cb(null, file)
                                                } else {
                                                    cb(e)
                                                }
                                            })
                                    } else {
                                        cb(null, file)
                                    }
                                }))
                                .pipe(gulpRename(distFileName))
                                .pipe(mediaOptimizer(media, imageminPlugins))
                                .pipe(gulp.dest(path.join(dist, distMedia)))
                                .on('end', () => {
                                    logger.info('Resized: ' + img.src + ' @ ' + width + 'x' + height)
                                    resolve()
                                })
                        })
                    }
                    Object.keys(img.srcset).forEach(imgSrc => {
                            const {width, height} = img.srcset[imgSrc]
                            if(width && !height) {
                                resizer.push(makeResizing(
                                    width, width / aspect, '_' + width + 'w',
                                ))
                            } else if(!width && height) {
                                resizer.push(makeResizing(
                                    height * aspect, height, '_' + height + 'h',
                                ))
                            } else if(width && height) {
                                resizer.push(makeResizing(
                                    width, height, '_' + width + 'w' + height + 'h',
                                ))
                            }
                        },
                    )
                }
            })
        }

        return Promise.all(resizer)
    }
    return {resizeUsedImages, getImage, clearGetMediaCache}
})()

// todo: rename to better `domain` function for adding size suffix
const addImageSuffixFn = (src = '', suffix = '') => {
    const lowerSrc = src.toLowerCase()
    const exts = ['.jpg', '.jpeg', '.png']
    // `.svg` must not be suffixed with `width` (as always relative), so here it is ignored in general
    // todo: add also generic
    exts.forEach(foundExt => {
        if(lowerSrc.endsWith(foundExt)) {
            src = src.substr(0, src.length - foundExt.length) + suffix + foundExt
        }
    })
    return src
}

export const addImageSuffix = {
    name: 'addImageSuffix',
    func: addImageSuffixFn,
}
