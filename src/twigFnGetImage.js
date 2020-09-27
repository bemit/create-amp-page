const {imageSize} = require('image-size')
const crypto = require('crypto')
const fs = require('fs')

const imageRefs = {current: {}}

exports.clearCache = (done) => {
    imageRefs.current = {}
    done()
}

exports.fn = (mediaPath, distMedia) => ({
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
                console.warn('getImage', e)
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
