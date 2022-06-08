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

export const makeTwigHandler = (
    {
        srcMedia, distMedia,
        paths, twig,
        ampOptimizer: ampOptimizerLib,
        minifyHtml, minifyHtmlOptions,
        cleanInlineCSS, cleanInlineCSSOptions,
        cleanInlineCSSWhitelist,
        cssInjectTag,
        cssFailOnSize,
        cssSizeLimit,
        cssBuffer,
    },
) => {
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
                    // logic = { functions: undefined, filters: undefined }
                    .then((logic) => logic)
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
                        paths: {
                            stylesInject: paths.stylesInject,
                            dist: paths.dist,
                            distStyles: paths.distStyles,
                        },
                        injectTag: cssInjectTag,
                        failOnSize: cssFailOnSize,
                        sizeLimit: cssSizeLimit,
                        cssBuffer: cssBuffer,
                    }))
                    // middlewares after CSS injection
                    .pipe(cleanHtmlCss({
                        minifyHtml, minifyHtmlOptions,
                        cleanInlineCSS, cleanInlineCSSOptions,
                        cleanInlineCSSWhitelist,
                    }))
                    .pipe(ampOptimizer(ampOptimizerLib)),
            )
        })
}

export const makeHtmlTask = (
    {
        paths,
        srcMedia, distMedia,
        dist,
        twig,
        data,
        fmMap,
        customMerge,
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
        collections.forEach((
            {
                fmMap: collectionFmMap,
                customMerge: collectionCustomMerge,
                ...collection
            },
        ) => {
            const cwd = process.cwd()
            if(typeof collection.fm === 'function') {
                htmlTasks.push(
                    function pagesByTemplates() {
                        return twigHandler()
                            .then((twigSubPipe) => {
                                return new Promise((resolve, reject) => {
                                    gulp.src(collection.tpl)
                                        .pipe(
                                            twigDataHandler(
                                                {
                                                    data,
                                                    fmMap: collectionFmMap || fmMap,
                                                    customMerge: collectionCustomMerge || customMerge,
                                                },
                                                collection,
                                                true,
                                            ),
                                        )
                                        .pipe(twigSubPipe)
                                        .pipe(gulp.dest(path.join(paths.dist, collection.base), {cwd: cwd}))
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
                                        .pipe(
                                            twigMultiLoad(
                                                {
                                                    data,
                                                    fmMap: collectionFmMap || fmMap,
                                                    customMerge: collectionCustomMerge || customMerge,
                                                },
                                                collection,
                                            ),
                                        )
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
