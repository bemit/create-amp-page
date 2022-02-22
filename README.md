# Create AMP Page

Fast development of fast pages.

[![npm (scoped)](https://img.shields.io/npm/v/create-amp-page?style=flat-square)](https://www.npmjs.com/package/create-amp-page)
[![npm (scoped)](https://img.shields.io/npm/dm/create-amp-page.svg?style=flat-square)](https://npmcharts.com/compare/create-amp-page?interval=30)
[![Travis (.com) master build](https://img.shields.io/travis/com/bemit/create-amp-page/master?style=flat-square)](https://travis-ci.com/github/bemit/create-amp-page)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)
![Typed](https://flat.badgen.net/badge/icon/Typed?icon=typescript&label&labelColor=blue&color=555555)

Static site generator built with gulp tasks, using Twig templates, optimized for building [AMP](https://amp.dev) pages - but not limited to AMP.

Support for Sass, CSS optimizing, CSS into head injection, media file compressing, automatic resizing of images by `srcset`, endless copy tasks, Twig global and optional per-page data with JSON and/or frontmatter, browsersync with custom static server middlewares, [AMP Optimizer](https://amp.dev/documentation/guides-and-tutorials/optimize-and-measure/amp-optimizer-guide/) or HTML Minifier (for non-AMP), remove unused CSS (currently only for inline CSS). Different ways to define pages, can be connected with e.g. netlify cms.

🚀 Checkout the [starter template repositories!](#starter-templates)

## Quick Start

**1.** Create a project folder, init your project with `npm init`

**2.** Create a `Gulpfile.js` and paste the following content in it. For all options and docs see the [AmpCreatorOptions typing](https://github.com/bemit/create-amp-page/blob/master/src/AmpCreatorOptions.d.ts).

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
    // faster rebuilds on dev:
    ampOptimize: process.env.NODE_ENV === 'production',
    cleanInlineCSS: process.env.NODE_ENV === 'production',
    prettyUrlExtensions: ['html'],
})
```

**3.** Add those scripts into `package.json`:

```json
{
    "scripts": {
        "tasks": "gulp --tasks",
        "start": "cross-env NODE_ENV=development gulp watch",
        "build": "cross-env NODE_ENV=production gulp build",
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

## Starter Templates

Checkout the starter repos:

- ⚡ [bemit/create-amp-page-starter](https://github.com/bemit/create-amp-page-starter)
    - ready configured for static AMP valid pages
    - includes a simple twig template
- ⚛️ [bemit/create-page-starter](https://github.com/bemit/create-page-starter)
    - ready configured for static pages, non-AMP pages
    - with babel/webpack build process
      - support for typescript/react configured
    - service worker example integrated
    - includes a simple twig template

## Page generations

Two integrated ways of page generation:

1. One page per template file
2. One page per content file, but for multiple files one template

**First** is also called `twig-as-entrypoint`, here the config `paths.htmlPages` is used as root folder for single pages.

**Second** is also called `frontmatter-as-entrypoint` or `collections`, here the config `collections` can be used to define multiple folders and map them to their dist. The folder must contain frontmatter files, for each folder the files are rendered against one template. It is possible to have another `fmMap` logic for each folder.

## Twig Functions

### getImage

Get metadata and sizing for image, caches the read-result for each execution, purging cache on each watch trigger of html.

- params:
    - `src` is the relative path to media folder incl. media folder
    - `srcset` is an array of objects, define in which image sizes the image should be resized
        - `w` = width in pixels, internally it calculates the other value proportional
- returns:
    - `src` path to file
    - `width` of file
    - `height` of file
    - `hash` sha1 hash of file content

#### getImage Twig Example

Template using `getImage(src, srcset)` to fetch metadata and resize images when needed:

```twig
{% set image = getImage(src, srcset) %}
<amp-img
    src="{{ image.src ~ '?key=' ~ (image.hash|slice(0,12)) }}"
    width="{{ image.width }}"
    height="{{ image.height }}"
    {# generate srcset with same syntax like `getImage` #}
    srcset="{% for set in srcset %}{{ addImageSuffix(image.src, '_'~set.w~'w') ~ '?key=' ~ (image.hash|slice(0,12))~' '~set.w~'w' }}{% if loop.index < (srcset|length) %}, {% endif %}{% endfor %}"
    sizes="{{ sizes }}"
    layout="responsive"
></amp-img>
```

Embed then in file, pixels at `srcset`:

```twig
{% embed 'image.twig' with {
    src: '/media/img-01.png',
    alt: 'A blog hero image',
    classes: 'flex',
    srcset: [
        {w: '320'},
        {w: '680'},
        {w: '920'}
    ],
    sizes: '(max-width: 320px) 320px, (max-width: 600px) 680px',
} %}
{% endembed %}
```

Generates HTML like:

```html
<amp-img
        src="/media/img-01.png?key=2l8ybbe1tjSP"
        width="1280" height="421"
        srcset="/media/img-01_320w.png?key=2l8ybbe1tjSP 320w, /media/img-01_680w.png?key=2l8ybbe1tjSP 680w, /media/img-01_920w.png?key=2l8ybbe1tjSP 920w"
        sizes="(max-width: 320px) 320px, (max-width: 600px) 680px"
        layout="responsive"
></amp-img>
```

### addImageSuffix

Add an image suffix between name and extension:

```twig
{{ addImageSuffix(image.src, '_suffix') }}
```

### embedScript

To embed e.g. css or js files directly in build template, uses the `src` relative to configured `dist`:

```twig
{{ embedScript('js/main.js') }}
```

## License

This project is free software distributed under the **MIT License**.

See: [LICENSE](LICENSE).

© 2022 [Michael Becker](https://mlbr.xyz)

### Versions

See [github release notes](https://github.com/ui-schema/ui-schema/releases) for updates, especially incompatibilities, for features check the current `AmpCreatorOptions` typing.

This project adheres to [semver](https://semver.org/).

### Contributors

By committing your code/creating a pull request to this repository you agree to release the code under the MIT License attached to the repository.
