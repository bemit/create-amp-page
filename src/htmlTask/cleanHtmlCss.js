const through2 = require('through2')
const {comb} = require('email-comb')
const {minify: htmlmin} = require('html-minifier')
const logger = require('gulplog')

exports.cleanHtmlCss = function({cleanInlineCSS, cleanInlineCSSWhitelist = [], minifyHtml}) {
    return through2.obj(async (file, _, cb) => {
        let startHtmlCSSSize = null
        if((cleanInlineCSS || minifyHtml) && file.isBuffer()) {
            startHtmlCSSSize = Buffer.byteLength(file.contents.toString(), 'utf8')
            logger.info('HTML + CSS Size: ' + startHtmlCSSSize + ' bytes @' + (file.pathData || file.path).substr(file.cwd.length + 1))
        }
        let cleanedHtmlResult = null
        if(cleanInlineCSS && file.isBuffer()) {
            cleanedHtmlResult = comb(file.contents.toString(), {whitelist: cleanInlineCSSWhitelist})
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
        if((cleanInlineCSS || minifyHtml) && file.isBuffer()) {
            const cleanedHtmlCSSSize = Buffer.byteLength(file.contents.toString(), 'utf8')
            if(cleanedHtmlResult) {
                logger.info('Removed CSS selectors: ' + cleanedHtmlResult.deletedFromBody.length + ' from body and ' + cleanedHtmlResult.deletedFromHead.length + ' from head')
            }
            logger.info('Cleaned HTML + CSS Size: ' + cleanedHtmlCSSSize + ' bytes, saved ' + (startHtmlCSSSize - cleanedHtmlCSSSize) + ' bytes @' + (file.pathData || file.path).substr(file.cwd.length))
        }
        cb(null, file)
    })
}
