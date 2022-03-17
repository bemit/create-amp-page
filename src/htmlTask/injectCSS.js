import fs from 'fs'
import colors from 'colors/safe.js'
import logger from 'gulplog'
import replace from 'gulp-replace'

/**
 *
 * @param paths
 * @param failOnSize
 * @param injectTag
 * @param cssBuffer
 */
export function injectCSS(
    {
        paths: {stylesInject, dist, distStyles} = {},
        failOnSize,
        sizeLimit = 75000,
        injectTag = 'style amp-custom>',
        cssBuffer = undefined,
    },
) {
    return replace(new RegExp(injectTag, 'g'), function() {
        if(!stylesInject) return injectTag

        let style = ''
        try {
            if(!cssBuffer) {
                style = fs.readFileSync(dist + '/' + distStyles + '/' + stylesInject, 'utf8')
            } else {
                style = cssBuffer.contents.toString()
            }
        } catch(err) {
            if(err.code !== 'ENOENT') {
                // only throw if other error then file not-found
                throw err
            }
        }
        if(Buffer.byteLength(style, 'utf8') > sizeLimit) {
            logger.error(colors.red('Style Size: ' + (Buffer.byteLength(style, 'utf8')) + ' bytes'))
            if(failOnSize) throw new Error('css file exceeds amp limit of ' + (sizeLimit / 1000).toFixed(0) + 'kb')
        } else {
            logger.info('Style Size: ' + (Buffer.byteLength(style, 'utf8')) + ' bytes')
        }
        return injectTag + '\n' + style + '\n'
    })
}
