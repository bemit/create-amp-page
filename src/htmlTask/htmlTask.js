const {parallel, series, ...gulp} = require('gulp')
const path = require('path')

const twigGulp = require('gulp-twig')
const {twigDataHandler} = require('./twigDataHandler')
const {twigMultiLoad, twigMultiSave} = require('./twigMultiRenderer')
const {ampOptimizer} = require('./ampOptimizer')
const {cleanHtmlCss} = require('./cleanHtmlCss')
const {injectCSS} = require('./injectCSS')

const {
    getImage, embedScript,
} = require('./twigFunctions')

const makeTwigHandler = ({
                             paths, twig,
                             ampOptimize,
                             minifyHtml,
                             cleanInlineCSS,
                             cleanInlineCSSWhitelist,
                             cssInjectTag,
                         }) => {
    const extendedTwigFunctions = [
        getImage(paths.media, paths.distMedia),
        embedScript(paths.dist),
    ]

    // share twig logic for `twig-as-entrypoint` and `frontmatter-as-entrypoint` (collections)
    return (stream) => {
        return stream.pipe(twigGulp({
                base: paths.html,
                trace: twig && twig.trace,
                extend: twig && twig.extend,
                functions: twig && twig.functions ?
                    [
                        ...extendedTwigFunctions,
                        ...twig.functions,
                    ] :
                    extendedTwigFunctions,
                filters: twig && twig.filters,
            }))
            // // middlewares after twig compilation
            // // middlewares for style injection
            .pipe(injectCSS({paths, failOnSize: process.env.NODE_ENV === 'production', injectTag: cssInjectTag}))
            // // middlewares after CSS injection
            .pipe(cleanHtmlCss({
                minifyHtml,
                cleanInlineCSS,
                cleanInlineCSSWhitelist,
            }))
            .pipe(ampOptimizer(ampOptimize))
    }
}

exports.makeTwigHandler = makeTwigHandler

const makeHtmlTask = (
    {
        paths,
        twig,
        collections,
        browsersync,
        additionalHtmlTasks = [],
        ...options
    },
) => {
    const htmlTasks = []

    const twigHandler = makeTwigHandler({paths, twig, ...options})
    htmlTasks.push(function pagesByTemplates() {
        return twigHandler(
            gulp.src(paths.htmlPages + '/*.twig')
                .pipe(twigDataHandler(twig)),
        )
            .pipe(gulp.dest(paths.dist))
            .pipe(browsersync.stream())
    })

    if(collections && Array.isArray(collections)) {
        collections.forEach(collection => {
            htmlTasks.push(function pagesByFrontmatter() {
                return twigHandler(
                    gulp.src(collection.data)
                        .pipe(twigMultiLoad(
                            {
                                ...twig,
                                ...(collection.fmMap ? {fmMap: collection.fmMap} : {}),
                                ...(collection.customMerge ? {customMerge: collection.customMerge} : {}),
                            },
                            collection.tpl,
                        )),
                )
                    .pipe(twigMultiSave(collection.ext))
                    .pipe(gulp.dest(path.join(paths.dist, collection.base)))
                    .pipe(browsersync.stream())
            })
        })
    }

    htmlTasks.push(...additionalHtmlTasks)

    return parallel(htmlTasks)
}

exports.makeHtmlTask = makeHtmlTask
