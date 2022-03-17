import path from 'path'
import gulp from 'gulp'
import {ampCreator} from './src/index.js'
import {getPageInfo} from './src/pageTools.js'

const port = 4488

/**
 * @type {PagesUrlsMap}
 */
const urls = {
    example: {
        local: {base: 'http://localhost:' + port + '/default/'},
        prod: {base: 'https://cap.bemit.codes/'},
    },
}

const pages = {
    example: {
        paths: {
            styles: 'example/styles',
            stylesInject: 'main.css',
            style: 'main.scss',
            html: 'example/html',
            dist: 'example/build',
            distStyles: 'styles',
        },
    },
}
const isDev = process.env.NODE_ENV === 'development'

const tasks = ampCreator({
    port: port,
    dist: 'example/build',
    srcMedia: 'example/media',
    distMedia: 'media',
    pages: pages,
    collections: [{
        fm: (file) => 'example/data/' + path.basename(file).replace('.twig', '').replace('.md', '') + '.md',
        tpl: 'example/html/pages/*.twig',
        pagesByTpl: true,
        base: '',
        pageId: 'example',
    }, {
        fm: 'example/data/blog/*.md',
        tpl: 'example/html/blog.twig',
        base: 'blog',
        pageId: 'example',
    }],
    ampOptimize: !isDev,
    // minifyHtml: false,
    cleanInlineCSS: !isDev,
    // for css injection of non-AMP pages:
    // cssInjectTag: '<style>',
    twig: {
        data: {ampEnabled: true},
        fmMap: (data, files) => {
            const pageId = files.pageId
            const {
                pagePath, pageBase,
            } = getPageInfo(files, urls, pageId, isDev ? 'local' : 'prod')
            const pageData = pages[pageId]
            return {
                pageId: pageId,
                styleSheets: [
                    pageData.paths.stylesInject,
                ],
                head: {
                    title: data.attributes.title,
                    description: data.attributes.description,
                    lang: data.attributes.lang,
                },
                links: {
                    canonical: pageBase + pagePath,
                    origin: pageBase,
                    cdn: isDev ? 'http://localhost:' + port + '/' : pageBase,
                },
                content: data.body,
            }
        },
        logicLoader: async () => {
            return {}
        },
    },
    prettyUrlExtensions: ['html'],
})

Object.keys(tasks).forEach(taskName => gulp.task(taskName, tasks[taskName]))
