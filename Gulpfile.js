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
        copy: [
            {src: ['./example/api/*'], prefix: 1},
            {src: ['./public/*'], prefix: 2},
        ],
        dist: 'example/build',
        distMedia: 'media',
        distStyles: 'styles',
    },
    twig: {
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
