import { extendFilter, extendFunction, extendTest, extendTag } from 'twig'
import { defaults } from 'email-comb'
import { Options as HtmlMinifierOptions } from 'html-minifier'
import { WatchOptions } from 'gulp'

export type FmMapFile = {
    // the `tpl` file path
    tpl: string
    // if the content is created by the template
    pagesByTpl?: boolean
    base?: string
    cwd: string
    // the `front-matter` file path
    pathFm?: string
    // the `.json` file path
    pathData?: string
    pageId?: string
}

export type fmMapFn = (
    // the `frontmatter` data
    fm: {
        attributes: Object
        body: string
        bodyBegin: number
        frontmatter: string
    },
    // information for the current rendered file
    fmFile: FmMapFile,
    // the data object so far, e.g. global data and `json` file,
    // ONLY read this variable, the full `data` object is generated after `fmMap`
    data: Object | undefined,
) => Object

export type fmMap = fmMapFn | ((...attr: Parameters<fmMapFn>) => ReturnType<fmMapFn>)

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

export interface AmpCreatorOptionsPaths {
    // folder of .scss/.sass files
    styles: string
    // the pattern for which files need to be build inside the `styles` folder, defaults to `'**/*.{scss,sass}'`
    style?: string
    // injects this stylesheet into `<style amp-custom/>`, optional
    // relative name to style dist folder
    stylesInject?: string
    // root folder of .twig templates
    html: string
    // folders / glob that should be copied into dist
    copy?: CopyInfo | CopyInfo[]
    // absolute, but must begin with root `dist` folder, where everything is saved
    dist: string
    // relative to `dist`, where CSS files are saved
    distStyles: string
}

export interface AmpCreatorCollection {
    // path to content directory with `*` placeholder for file, is passed to `gulp.src`, supports any file [`front-matter`](https://www.npmjs.com/package/front-matter) supports
    // OR a function for `pages-by-tpl`:
    // receives the absolute path to the template file, must return path to front-matter file, for "file does not exist" without an error return `undefined`
    fm: string | (((file: string) => string | undefined) | undefined)
    // optional, experimental, only for `pages-by-tpl`,
    // async frontmatter loader, if `fm` is defined returns a `string` it is executed with that `string`,
    // if `fmLoad` is not defined, the standard read from json-file is executed
    fmLoad?: (fmPath: string) => Promise<{ [k: string]: any } | undefined>
    // path to the single template that will be used
    tpl: string
    // relative base to dist
    base: string
    // receives the absolute path to the `frontmatter` file, optional
    // must return path to JSON file to use as data for this template
    // for "file does not exist" without an error return `undefined`
    json?: (file: string) => string | undefined
    jsonFailOnMissing?: boolean
    // the loader is executed when `json` result is a `string`, receives the result of `json`
    jsonLoader?: (file: string) => Promise<any | undefined>
    // overwrite global `fmMap` for this collection
    fmMap?: fmMap
    // overwrite global `customMerge` for this collection
    customMerge?: customMerge
    // used extension, needed for file handling, defaults to `.md`
    ext?: string
    // used output extension, needed for file saving, defaults to `.html`
    extOut?: string
    // can be used for e.g. multi page routing
    pageId?: string
}

export interface AmpCreatorDataDefault {
    cssInject?: boolean
    ampEnabled: boolean
    injectNetlifyIdentity?: boolean
    serviceWorker?: {
        load?: boolean
        // activated logging on success and error
        loadDebug?: boolean
        // activates logging only on error:
        loadDebugError?: boolean
    }
}

export interface AmpCreatorOptions<D extends {} = AmpCreatorDataDefault> {
    // yeah, the port, used by the main browserSync instances, for multi pages use additionally `pages.%.port`
    port: number
    // if browserSync should open the server, if it is a `string`, will be used as start page
    open?: boolean | string
    // root folder for the dist/build folders,
    // also the root of static server
    dist: string
    // for SPA / PWA
    historyFallback?: string

    // root folder of media files that should be processed
    srcMedia: string
    // relative to `dist`, where media files are saved
    distMedia: string

    pages?: {
        [page: string]: {
            paths: AmpCreatorOptionsPaths
        }
    }

    // define content and template collections
    // - generate pages by *frontmatter*, uses one template for multiple data files
    //     - `fm` as string with glob like `src/data/blog/*.md`
    //     - `tpl` as string like `src/html/blog.twig`
    // - generate pages by *template*, uses one template for one data file
    //     - `fm` as function(tplFilePath): string; which must return the non-glob path to the data file
    //     - `tpl` as string with glob like `src/html/pages/*.twig`
    collections?: AmpCreatorCollection[]

    // which extensions should be removed for prettier URLs, like `/contact` instead of `/contact.html`
    prettyUrlExtensions?: string[]

    // middlewares passed to serve-static
    serveStaticMiddleware?: Function[]

    // data passed globally to the twig templates, optional
    data?: D & {
        [key: string]: any
    }
    // receives the front matter and absolute path, for mapping to template values;
    fmMap?: fmMap
    // merge function to produce data from multiple sources for twig, optional;
    // used for merging the three twig data sources: global (`twig.data`), `twig.json` and `twig.fm`;
    // like let data = customMerge(globalTwigData, jsonData); data = customMerge(data, fmData);
    customMerge?: customMerge

    // settings used for `gulp-twig` and related plugins
    twig?: {
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
        } | Promise<{
            functions?: TwigFunction[]
            filters?: TwigFunction[]
        }>
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
    watchOptions?: WatchOptions

    // enable the ampOptimizer, since 1.0.0-alpha.12 pass down an instance!
    ampOptimizer?: any

    // custom inject tag, for AMP / default: 'style amp-custom>'
    cssInjectTag?: string
    // if an `Error` should be thrown when exceeding `cssSizeLimit`
    cssFailOnSize?: boolean
    // maximum bytes for CSS file, after minimizing, before clean-unused,
    // defaults to `75000` bytes (AMP limit)
    cssSizeLimit?: number

    // remove unused inline CSS
    cleanInlineCSS?: boolean
    // css selectors which must not be removed, `.classes`, `#ids`, `.simple-whitelist-*`, `h1`, `p`
    cleanInlineCSSWhitelist?: string[]
    // options for `email-comb` - run when `cleanInlineCSS` is `true`,
    // when `cleanInlineCSSOptions` specified the `cleanInlineCSSWhitelist` options does nothing
    cleanInlineCSSOptions?: Partial<typeof defaults>

    // minify HTML, when not using `ampOptimizer`
    minifyHtml?: boolean
    minifyHtmlOptions?: HtmlMinifierOptions

    // additional folders to delete
    cleanFolders?: string[]

    // overwrite config for the respective imagemin module
    // todo: add typings
    media?: {
        gif?: Object | { interlaced: boolean }
        jpg?: Object | { progressive: boolean }
        png?: Object | { optimizationLevel: number }
        svg?: Object | { plugins: Object[] }
        [k: string]: any
    }
    // add further imagemin plugins, a function which receives the `imagemin` instance and returns an array of plugins
    imageminPlugins?: (imagemin: any, media: AmpCreatorOptions['media']) => Function[]
}

export function getOptions(options: AmpCreatorOptions): AmpCreatorOptions
