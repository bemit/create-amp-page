import { extendFilter, extendFunction, extendTest, extendTag } from 'twig'

export type fmMap = (
    data: { attributes: Object, body: string, bodyBegin: number, frontmatter: string },
    file: { path: string, relative: string, base: string, cwd: string, pathData?: string }
) => Object
export type customMerge = (data1: Object, data2: Object) => Object

export interface CopyInfo {
    // array of paths / glob patterns that will be copied
    src: string[]
    // how many pf the leading path segments should be removed
    prefix: number
}

export interface TwigFunction {
    // name of function
    name: string
    // the actual implementation
    func: Function
}

export interface AmpCreatorOptions {
    // yeah, the port
    port: number

    // file paths to sources and build
    paths: {
        // folder of .scss/.sass files
        styles: string
        // injects this stylesheet into `<style amp-custom/>`, optional
        // relative name to style dist folder
        stylesInject?: string
        // root folder of .twig templates
        html: string
        // root folder of templates that will be used as pages
        htmlPages: string
        // root folder of media files that should be processed
        media: string
        // folders / glob that should be copied into dist
        copy?: CopyInfo | CopyInfo[]
        // folder where everything is served,
        // also the root of static server
        dist: string
        // relative to `dist`, where media files are saved
        distMedia: string
        // relative to `dist`, where CSS files are saved
        distStyles: string
        // for SPA / PWA
        historyFallback?: string
    },

    // generate pages by frontmatter, use one template for multiple input data files
    collections?: {
        // path to content directory, is passed to `gulp.src`
        data: string
        // path to the single template that will be used
        tpl: string
        // relative base to dist
        base: string
        // overwrite global `fmMap` for this collection
        fmMap?: fmMap
        // overwrite global `customMerge` for this collection
        customMerge?: customMerge
        // used extension, needed for file handling, defaults to `.md`
        ext?: string
    }[]

    // which extensions should be removed for prettier URLs, like `/contact` instead of `/contact.html`
    prettyUrlExtensions?: string[]

    // middlewares passed to serve-static
    serveStaticMiddleware?: Function[]

    // settings used for `gulp-twig` and related plugins
    twig?: {
        // data passed globally to the twig templates, optional
        data?: { [key: string]: any }
        // receives the absolute path to the template file, optional
        // must return path to JSON file to use as data for this template
        // for "file does not exist" without an error return `undefined`
        json?: (file: string) => string | undefined
        // receives the absolute path to the template file, optional
        // must return path to front-matter file
        // for "file does not exist" without an error return `undefined`
        fm?: (file: string) => string | undefined
        // receives the front matter and absolute path, for mapping to template values;
        // required when `fm` exists, otherwise not used
        fmMap?: fmMap
        // merge function to produce data from multiple sources for twig, optional;
        // used for merging the three twig data sources: global (`twig.data`), `twig.json` and `twig.fm`;
        // like let data = customMerge(globalTwigData, jsonData); data = customMerge(data, fmData);
        customMerge?: customMerge
        // extends Twig with new tags types, the `Twig` parameter is the internal Twig.js object;
        // https://github.com/twigjs/twig.js/wiki/Extending-twig.js-With-Custom-Tags
        extend?: (
            Twig: {
                exports: {
                    extendFilter: typeof extendFilter
                    extendFunction: typeof extendFunction
                    extendTest: typeof extendTest
                    extendTag: typeof extendTag
                }
            }
        ) => void
        // add custom functions to Twig
        functions?: TwigFunction[]
        // add custom filters to Twig
        filters?: TwigFunction[]
        // a function that is reloaded every runtime and supplied additional twig logics,
        // for e.g. changing `functions` and `filters` without restarting the whole gulp process
        logicLoader?: () => {
            functions?: TwigFunction[]
            filters?: TwigFunction[]
        }
        // output file extension including the '.' like path.extname(filename). Use true to keep source extname and a "falsy" value to drop the file extension
        outputExtname?: string | boolean
        // enables debug info logging
        debug?: boolean
        // enables tracing info logging
        trace?: boolean
        // enables the twig build cache
        cache?: boolean
    }

    // configuring the watched folders for the main tasks
    watchFolders?: {
        sass?: string[]
        twig?: string[]
        media?: string[]
    }

    // auto use default configs with `true`;
    // or specify custom options, see all:
    // https://github.com/ampproject/amp-toolbox/tree/main/packages/optimizer#options
    ampOptimize?: boolean | {
        autoAddMandatoryTags?: boolean
        autoExtensionImport?: boolean
        extensionVersions?: Object
        format?: string | 'AMP' | 'AMP4EMAIL' | 'AMP4ADS'
        imageBasePath?: string | (
            /**
             * @param imgSrc the path used in `src`
             * @param params todo: correctly type this
             */
            (imgSrc: string, params: any) => string)
        imageOptimizer?: (src: string, width: string | number) => string
        lts?: boolean
        markdown?: boolean
        minify?: boolean
        preloadHeroImage?: boolean
        verbose?: boolean
    }

    // custom inject tag, for AMP / default: 'style amp-custom>'
    cssInjectTag?: string

    // remove unused inline CSS
    cleanInlineCSS?: boolean
    // css selectors which must not be removed, `.classes`, `#ids`, `.simple-whitelist-*`, `h1`, `p`
    cleanInlineCSSWhitelist?: string[]

    // minify HTML, when not using `ampOptimize`
    minifyHtml?: boolean

    // additional folders to delete
    cleanFolders?: string[]

    // overwrite config for the respective imagemin module
    // todo: add typings
    media?: {
        gif?: Object | { interlaced: boolean }
        jpg?: Object | { progressive: boolean }
        png?: Object | { optimizationLevel: number }
        svg?: Object | { plugins: Object[] }
    } & Object | Object
    // add further imagemin plugins, a function which receives the `imagemin` instance and returns an array of plugins
    imageminPlugins?: (imagemin: any) => Function[]
}

export function getOptions(options: AmpCreatorOptions): AmpCreatorOptions
