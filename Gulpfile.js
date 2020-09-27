'use strict'
const path = require('path')
const {ampCreator} = require('./src')

module.exports = ampCreator({
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
    ampOptimize: process.env.NODE_ENV === 'production',
    // minifyHtml: false,
    removeInlineCSS: process.env.NODE_ENV === 'production',
    // for css injection of non-AMP pages:
    // cssInjectTag: '<style>',
    twig: {
        data: {ampEnabled: true},
        fm: (file) => './example/data/' + path.basename(file).replace('.twig', '') + '.md',
        fmMap: (data) => ({
            head: {
                title: data.attributes.title,
                description: data.attributes.description,
                lang: data.attributes.lang,
            },
        }),
    },
    prettyUrlExtensions: ['html'],
})
