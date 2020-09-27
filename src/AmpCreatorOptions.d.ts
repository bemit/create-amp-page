import { extendFilter, extendFunction, extendTest, extendTag } from 'twig'
import { Gulp } from 'gulp'

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

    // which extensions should be removed for prettier URLs, like `/contact` instead of `/contact.html`
    prettyUrlExtensions?: string[]

    // middlewares passed to serve-static
    serveStaticMiddleware?: Function[]

    // settings used for `gulp-twig` and related plugins
    twig?: {
        // data passed globally to the twig templates, optional
        data?: { [key: string]: any }
        // receives the absolute path to the template file, optional;
        // must return path to JSON file to use as data for this template
        json?: (file: string) => string
        // receives the absolute path to the template file, must return path to frontmatter file, optional
        fm?: (file: string) => string
        // receives the front matter and absolute path, for mapping to template values;
        // required when `fm` exists, otherwise not used
        fmMap?: (data: { attributes: Object, body: string, bodyBegin: number, frontmatter: string }, file: string) => Object
        // merge function to produce data from multiple sources for twig, optional;
        // used for merging the three twig data sources: global (`twig.data`), `twig.json` and `twig.fm`;
        // like let data = customMerge(globalTwigData, jsonData); data = customMerge(data, fmData);
        customMerge?: (data1: Object, data2: Object) => Object
        // enables tracing info logging
        trace?: boolean
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
    }

    // configuring the watched folders for the main tasks
    watchFolders?: {
        sass?: []
        twig?: []
        media?: []
    }
    // overrides the default watch function used, receives the gulp instance;
    // must return the actual watch task function;
    watchOverride?: (
        gulp: Gulp,
        factories: {
            // returns the actual function handling Sass to CSS and CSS optimized, fail=true = fail-on-warnings
            cssFactory: (fail?: boolean) => Function
            // returns the actual function handling Twig to HTML, failOnSize=true = fail if CSS is bigger then 75KB (AMP compatibility)
            htmlFactory: (failOnSize?: boolean) => Function
            // returns the actual function handling media optimizes
            imagesFactory: () => Function
        }
    ) => Function

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
    cleanInlineCSSWhitelist?: string[]

    // minify HTML, when not using `ampOptimize`
    minifyHtml?: boolean

    // additional folders to delete
    cleanFolders?: string[]
}

export function getOptions(options: AmpCreatorOptions): AmpCreatorOptions
