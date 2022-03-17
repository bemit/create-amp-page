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
                                    srcMedia, distMedia,
                                    paths, twig,
                                    ampOptimize,
                                    minifyHtml,
                                    cleanInlineCSS,
                                    cleanInlineCSSWhitelist,
                                    cssInjectTag,
                                    cssFailOnSize,
                                    cssBuffer,
                                }) => {
    const extendedTwigFunctions = [
        getImage(srcMedia, distMedia),
        embedScript(paths.dist),
        addImageSuffix,
    ]

    return () => Promise.resolve()
        .then(() => {
            // share twig logic for `twig-as-entrypoint` and `frontmatter-as-entrypoint` (collections)
            if(twig.logicLoader) {
                return twig.logicLoader()
                    .then((logic) => {
                        // const extraLogic = {
                        //     functions: undefined,
                        //     filters: undefined,
                        // }
                        return logic
                    })
            }
            return {}
        })
        .then((extraLogic = {}) => {
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
                        failOnSize: cssFailOnSize,
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
        })
}

export const makeHtmlTask = (
    {
        paths,
        srcMedia, distMedia,
        dist,
        twig,
        collections,
        browsersync,
        additionalHtmlTasks = [],
        imageminPlugins,
        ...options
    },
) => {
    const htmlTasks = []

    const twigHandler = makeTwigHandler({
        paths, twig,
        srcMedia, distMedia,
        ...options,
    })

    if(collections && Array.isArray(collections)) {
        collections.forEach(({fmMap, customMerge, ...collection}) => {
            const cwd = process.cwd()
            if(collection.pagesByTpl) {
                htmlTasks.push(
                    function pagesByTemplates() {
                        return twigHandler()
                            .then((twigSubPipe) => {
                                return new Promise((resolve, reject) => {
                                    gulp.src(collection.tpl)
                                        .pipe(
                                            twigDataHandler(
                                                {
                                                    ...twig,
                                                    ...(fmMap ? {fmMap: fmMap} : {}),
                                                    ...(customMerge ? {customMerge: customMerge} : {}),
                                                },
                                                collection,
                                            ),
                                        )
                                        .pipe(twigSubPipe)
                                        .pipe(gulp.dest(paths.dist))
                                        .pipe(browsersync.stream())
                                        .on('finish', resolve)
                                        .on('error', reject)
                                })
                            })
                    },
                )
            } else {
                htmlTasks.push(
                    function pagesByFrontmatter() {
                        return twigHandler()
                            .then((twigSubPipe) => {
                                return new Promise((resolve, reject) => {
                                    // todo: add support for different loaders, incl. async
                                    gulp.src(collection.fm)
                                        .pipe(twigMultiLoad(
                                            {
                                                ...twig,
                                                ...(fmMap ? {fmMap: fmMap} : {}),
                                                ...(customMerge ? {customMerge: customMerge} : {}),
                                            },
                                            collection,
                                        ))
                                        .pipe(twigSubPipe)
                                        .pipe(twigMultiSave(collection.ext, collection.extOut))
                                        .pipe(gulp.dest(path.join(paths.dist, collection.base), {cwd: cwd}))
                                        .pipe(browsersync.stream())
                                        .on('finish', resolve)
                                        .on('error', reject)
                                })
                            })
                    },
                )
            }
        })
    }

    htmlTasks.push(...additionalHtmlTasks)

    return series(parallel(htmlTasks), resizeUsedImages({
        media: srcMedia,
        dist,
        distMedia,
        imageminPlugins,
    }))
}
