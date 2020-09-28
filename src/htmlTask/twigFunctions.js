const {imageSize} = require('image-size')
const path = require('path')
const crypto = require('crypto')
const fs = require('fs')

const imageRefs = {current: {}}

exports.clearGetImageCache = function clearGetImageCache(done) {
    imageRefs.current = {}
    if(done) {
        done()
    }
}

exports.getImage = (mediaPath, distMedia) => ({
    name: 'getImage',
    func: (src) => {
        if(!imageRefs.current[src] || !imageRefs.current[src].hash) {
            let dimensions = {width: 0, height: 0}
            let hash
            try {
                const srcPath = mediaPath + src.replace(new RegExp(distMedia, 'i'), '')
                dimensions = imageSize(srcPath)
                hash = crypto.createHash('sha1').update(fs.readFileSync(srcPath)).digest('base64')
            } catch(e) {
                if(process.env.NODE_ENV === 'production') {
                    console.error('getImage', e)
                    throw e
                } else {
                    console.warn('getImage', e)
                }
            }
            if(hash) {
                imageRefs.current[src] = {
                    src,
                    width: dimensions.width,
                    height: dimensions.height,
                    hash,
                }
            }
        }
        return imageRefs.current[src]
    },
})

exports.embedScript = (dist) => ({
    name: 'embedScript',
    func: (src) => {
        let file
        try {
            file = fs.readFileSync(path.join(dist, src))
        } catch(e) {
            if(process.env.NODE_ENV === 'production') {
                console.error(e)
                throw e
            } else {
                console.warn(e)
            }
        }
        return file ? file.toString() : ''
    },
})
