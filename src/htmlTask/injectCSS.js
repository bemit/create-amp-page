const fs = require('fs')
const colors = require('colors/safe')
const logger = require('gulplog')
const replace = require('gulp-replace')
/**
 *
 * @param paths
 * @param failOnSize
 * @param injectTag
 * @param cssBuffer
 */
exports.injectCSS = function(
    {
        paths,
        failOnSize,
        injectTag = 'style amp-custom>',
        cssBuffer = undefined,
    },
) {
    return replace(new RegExp(injectTag, 'g'), function() {
        if(!paths.stylesInject) return injectTag

        let style = ''
        try {
            if(!cssBuffer) {
                style = fs.readFileSync(paths.dist + '/' + paths.distStyles + '/' + paths.stylesInject, 'utf8')
            } else {
                style = cssBuffer.contents.toString()
            }
            if(Buffer.byteLength(style, 'utf8') > 75000) {
                logger.error(colors.red('Style Size: ' + (Buffer.byteLength(style, 'utf8')) + ' bytes'))
                if(failOnSize) throw new Error('css file exceeds amp limit of 75kb')
            } else {
                logger.info('Style Size: ' + (Buffer.byteLength(style, 'utf8')) + ' bytes')
            }
        } catch(err) {
            if(failOnSize || err.code !== 'ENOENT') {
                // only throw if other error then file not-found
                throw err
            }
        }
        return injectTag + '\n' + style + '\n'
    })
}
