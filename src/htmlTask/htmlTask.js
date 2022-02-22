import gulpBase from 'gulp'
import path from 'path'
import {subpipe} from '../subpipe.js'

import twigGulp from 'gulp-twig'
import {twigDataHandler} from './twigDataHandler.js'
import {twigMultiLoad, twigMultiSave} from './twigMultiRenderer.js'
import {ampOptimizer} from './ampOptimizer.js'
import {cleanHtmlCss} from './cleanHtmlCss.js'
import {injectCSS} from './injectCSS.js'

import {embedScript} from './twigFunctions.js'

import {getImage, resizeUsedImages, addImageSuffix} from './twigFnMedia.js'

const {parallel, series, ...gulp} = gulpBase

export const makeTwigHandler = ({
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

    return async () => {
        // share twig logic for `twig-as-entrypoint` and `frontmatter-as-entrypoint` (collections)
        const extraLogic = {
            functions: undefined,
            filters: undefined,
        }
        if(twig.logicLoader) {
            const logic = await twig.logicLoader()
            if(logic.functions) {
                extraLogic.functions = logic.functions
            }
            if(logic.filters) {
                extraLogic.filters = logic.filters
            }
        }
        return subpipe((stream) =>
            stream
                .pipe(twigGulp({
                    base: paths.html,
                    extend: twig && twig.extend,
                    functions: [
                        ...extendedTwigFunctions,
                        ...(twig && twig.functions ? twig.functions : []),
                        ...(extraLogic.functions || []),
                    ],
                    filters: [
                        ...(twig && twig.filters ? twig.filters : []),
                        ...(extraLogic.filters || []),
                    ],
                    extname: twig && typeof twig.outputExtname !== 'undefined' ? twig.outputExtname : '.html',
                    cache: Boolean(twig && twig.cache),
                    debug: Boolean(twig && twig.debug),
                    trace: Boolean(twig && twig.trace),
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
                .pipe(ampOptimizer(ampOptimize)),
        )
    }
}

export const makeHtmlTask = (
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
    htmlTasks.push(
        function pagesByTemplates() {
            return new Promise(async (resolve, reject) => {
                gulp.src(paths.htmlPages + '/*.twig')
                    .pipe(twigDataHandler(twig))
                    .pipe(await twigHandler())
                    .pipe(gulp.dest(paths.dist))
                    .pipe(browsersync.stream())
                    .on('finish', resolve)
                    .on('error', reject)
            })
        },
    )

    if(collections && Array.isArray(collections)) {
        collections.forEach(({data, fmMap, customMerge, ...collection}) => {
            const cwd = process.cwd()
            htmlTasks.push(
                function pagesByFrontmatter() {
                    return new Promise(async (resolve, reject) => {
                        // todo: add support for different loaders, incl. async
                        gulp.src(data)
                            .pipe(twigMultiLoad(
                                {
                                    ...twig,
                                    ...(fmMap ? {fmMap: fmMap} : {}),
                                    ...(customMerge ? {customMerge: customMerge} : {}),
                                },
                                collection,
                            ))
                            .pipe(await twigHandler())
                            .pipe(twigMultiSave(collection.ext, collection.extOut))
                            .pipe(gulp.dest(path.join(paths.dist, collection.base), {cwd: cwd}))
                            .pipe(browsersync.stream())
                            .on('finish', resolve)
                            .on('error', reject)
                    })
                },
            )
        })
    }

    htmlTasks.push(...additionalHtmlTasks)

    return series(parallel(htmlTasks), resizeUsedImages({...paths, imageminPlugins}))
}
