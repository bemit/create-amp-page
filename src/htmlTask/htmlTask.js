const {parallel, series, ...gulp} = require('gulp')
const path = require('path')
const {subpipe} = require('../subpipe')

const twigGulp = require('gulp-twig')
const {twigDataHandler} = require('./twigDataHandler')
const {twigMultiLoad, twigMultiSave} = require('./twigMultiRenderer')
const {ampOptimizer} = require('./ampOptimizer')
const {cleanHtmlCss} = require('./cleanHtmlCss')
const {injectCSS} = require('./injectCSS')

const {
    embedScript,
} = require('./twigFunctions')

const {
    getImage, resizeUsedImages, addImageSuffix,
} = require('./twigFnMedia')

const makeTwigHandler = ({
                             paths, twig,
                             ampOptimize,
                             minifyHtml,
                             cleanInlineCSS,
                             cleanInlineCSSWhitelist,
                             cssInjectTag,
                             cssBuffer,
                         }) => {
    const extendedTwigFunctions = [
        getImage(paths.media, paths.distMedia),
        embedScript(paths.dist),
        addImageSuffix,
    ]

    return () => subpipe((stream) => {
        // share twig logic for `twig-as-entrypoint` and `frontmatter-as-entrypoint` (collections)
        return stream
            .pipe(twigGulp({
                base: paths.html,
                extend: twig && twig.extend,
                functions: twig && twig.functions ?
                    [
                        ...extendedTwigFunctions,
                        ...twig.functions,
                    ] :
                    extendedTwigFunctions,
                filters: twig && twig.filters,
                extname: twig && typeof twig.outputExtname !== 'undefined' ? twig.outputExtname : '.html',
                cache: !!(twig && twig.cache),
                debug: !!(twig && twig.debug),
                trace: !!(twig && twig.trace),
            }))
            // middlewares after twig compilation
            // middlewares for style injection
            .pipe(injectCSS({
                paths, injectTag: cssInjectTag,
                failOnSize: process.env.NODE_ENV === 'production',
                cssBuffer: cssBuffer,
            }))
            // middlewares after CSS injection
            .pipe(cleanHtmlCss({
                minifyHtml,
                cleanInlineCSS,
                cleanInlineCSSWhitelist,
            }))
            .pipe(ampOptimizer(ampOptimize))
    })
}

exports.makeTwigHandler = makeTwigHandler

const makeHtmlTask = (
    {
        paths,
        twig,
        collections,
        browsersync,
        additionalHtmlTasks = [],
        imageminPlugins,
        ...options
    },
) => {
    const htmlTasks = []

    const twigHandler = makeTwigHandler({paths, twig, ...options})
    htmlTasks.push(function pagesByTemplates() {
        return gulp.src(paths.htmlPages + '/*.twig')
            .pipe(twigDataHandler(twig))
            .pipe(twigHandler())
            .pipe(gulp.dest(paths.dist))
            .pipe(browsersync.stream())
    })

    if(collections && Array.isArray(collections)) {
        collections.forEach(collection => {
            htmlTasks.push(function pagesByFrontmatter() {
                return gulp.src(collection.data)
                    .pipe(twigMultiLoad(
                        {
                            ...twig,
                            ...(collection.fmMap ? {fmMap: collection.fmMap} : {}),
                            ...(collection.customMerge ? {customMerge: collection.customMerge} : {}),
                        },
                        collection.tpl,
                    ))
                    .pipe(twigHandler())
                    .pipe(twigMultiSave(collection.ext))
                    .pipe(gulp.dest(path.join(paths.dist, collection.base)))
                    .pipe(browsersync.stream())
            })
        })
    }

    htmlTasks.push(...additionalHtmlTasks)

    return series(parallel(htmlTasks), resizeUsedImages({...paths, imageminPlugins}))
}

exports.makeHtmlTask = makeHtmlTask
