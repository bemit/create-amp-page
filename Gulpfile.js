import path from 'path'
import gulp from 'gulp'
import {ampCreator} from './src/index.js'


const tasks = ampCreator({
    port: 4488,
    paths: {
        styles: 'example/styles',
        stylesInject: 'main.css',
        html: 'example/html',
        htmlPages: 'example/html/pages',
        media: 'example/media',
        dist: 'example/build',
        distMedia: 'media',
        distStyles: 'styles',
    },
    collections: [{
        data: 'example/data/blog/*.md',
        tpl: 'example/html/blog.twig',
        base: 'blog/',
    }],
    ampOptimize: process.env.NODE_ENV === 'production',
    // minifyHtml: false,
    cleanInlineCSS: process.env.NODE_ENV === 'production',
    // for css injection of non-AMP pages:
    // cssInjectTag: '<style>',
    twig: {
        data: {ampEnabled: true},
        fm: (file) => './example/data/' + path.basename(file).replace('.twig', '') + '.md',
        fmMap: (data, file) => ({
            head: {
                title: data.attributes.title,
                description: data.attributes.description,
                lang: data.attributes.lang,
            },
            content: data.body,
            links: {
                canonical: 'http://localhost:4488/' + file.relative,
            },
        }),
        logicLoader: async () => {
            return {}
        },
    },
    prettyUrlExtensions: ['html'],
})

Object.keys(tasks).forEach(taskName => gulp.task(taskName, tasks[taskName]))
