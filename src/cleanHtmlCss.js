const path = require('path')
const through2 = require('through2')
const {comb} = require('email-comb')
const {minify: htmlmin} = require('html-minifier')
const logger = require('gulplog')

exports.cleanHtmlCss = function({removeInlineCSS, removeInlineCSSWhitelist = [], minifyHtml}) {
    return through2.obj(async (file, _, cb) => {
        let startHtmlCSSSize = null
        if((removeInlineCSS || minifyHtml) && file.isBuffer()) {
            startHtmlCSSSize = Buffer.byteLength(file.contents.toString(), 'utf8')
            logger.info('HTML + CSS Size: ' + startHtmlCSSSize + ' bytes @' + path.basename(file.path))
        }
        let cleanedHtmlResult = null
        if(removeInlineCSS && file.isBuffer()) {
            cleanedHtmlResult = comb(file.contents.toString(), {whitelist: removeInlineCSSWhitelist})
            file.contents = Buffer.from(cleanedHtmlResult.result)
        }
        if(minifyHtml && file.isBuffer()) {
            file.contents = Buffer.from(htmlmin(file.contents.toString(), {
                collapseBooleanAttributes: true,
                collapseInlineTagWhitespace: false,
                collapseWhitespace: true,
                decodeEntities: true,
                removeAttributeQuotes: true,
            }))
        }
        if((removeInlineCSS || minifyHtml) && file.isBuffer()) {
            const cleanedHtmlCSSSize = Buffer.byteLength(file.contents.toString(), 'utf8')
            logger.info('Cleaned HTML + CSS Size: ' + cleanedHtmlCSSSize + ' bytes, saved ' + (startHtmlCSSSize - cleanedHtmlCSSSize) + ' bytes' + (cleanedHtmlResult ? ', removed CSS selectors: ' + cleanedHtmlResult.deletedFromBody.length + ' from body and ' + cleanedHtmlResult.deletedFromHead.length + ' from head' : '') + ' @' + path.basename(file.path))
        }
        cb(null, file)
    })
}
