# Create AMP Page

Fast development of fast pages.

[![npm (scoped)](https://img.shields.io/npm/v/create-amp-page?style=flat-square)](https://www.npmjs.com/package/create-amp-page)
[![Travis (.com) master build](https://img.shields.io/travis/com/bemit/Formanta/master?style=flat-square)](https://travis-ci.com/bemit/Formanta)
![Typed with TypeScript](https://flat.badgen.net/badge/icon/Typed?icon=typescript&label&labelColor=blue&color=555555)
[![Run on CodeSandbox](https://img.shields.io/badge/run%20starter%20sandbox-grey?labelColor=fff&logoColor=505050&style=flat-square&logo=codesandbox)](https://codesandbox.io/s/github/bemit/create-amp-page-starter)

Static site generator built with gulp tasks, using Twig templates, optimized for building [AMP](https://amp.dev) pages.

Support for Sass, CSS optimizing, media file compressing, copy tasks, Twig global and optional per-page data with JSON and/or frontmatter, browsersync with custom static server middlewares.

[Simple starter template?](#starter-template)

## Quick Start

**1.** Create a project folder, init your project with `npm init`

**2.** Create a `Gulpfile.js` and paste the following content in it. For all options and docs see the [AmpCreatorOptions typing](https://github.com/bemit/Formanta/blob/master/packages/create-amp-page/ampCreator.d.ts). 

```js
const path = require('path')
const {ampCreator} = require('create-amp-page')

module.exports = ampCreator({
    port: 4488,
    paths: {
        styles: 'src/styles',
        stylesInject: 'main.css',
        html: 'src/html',
        htmlPages: 'src/html/pages',
        media: 'src/media',
        /* copy: [
            {src: ['./src/api/*'], prefix: 1},
            {src: ['./public/*'], prefix: 2},
        ], */
        dist: 'build',
        distMedia: 'media',
        distStyles: 'styles',
    },
    twig: {
        // custom global template data
        data: {},
    },
    prettyUrlExtensions: ['html'],
})
```

**3.** Add those scripts into `package.json`:

```json
{
    "scripts": {
        "tasks": "gulp --tasks",
        "start": "gulp watch",
        "build": "gulp build",
        "clean": "gulp clean"
    }
}
```

**4.** Create a `postcss.config.js` with:

```js
module.exports = {
    plugins: [
        require('cssnano')({
            preset: ['default', {
                discardComments: {
                    removeAll: true,
                },
            }],
        }),
    ],
}
```

**5.** Add your `src` folders & files, minimum for this config: `src/styles/main.scss` and `src/html/pages/index.twig` and `src/media/.gitkeep`

**6.** Install this SSR: `npm i --save create-amp-page`

**7.** Run `npm start` and happy coding!

## Starter Template

Checkout this [AMP page start](https://github.com/bemit/create-amp-page-starter) for a preconfigured template repository.

## License

This project is free software distributed under the **MIT License**.

See: [LICENSE](LICENSE).

© 2020 [Michael Becker](https://mlbr.xyz)

### Contributors

By committing your code/creating a pull request to this repository you agree to release the code under the MIT License attached to the repository.

This package is managed [in a monorepo](https://github.com/bemit/Formanta).
