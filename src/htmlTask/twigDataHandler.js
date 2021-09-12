import fs from 'fs'
import gulpData from 'gulp-data'
import frontmatter from 'front-matter'

export const handleData = (
    data = {},
    customMerge,
    jsonContent,
    fmContent,
    fmMap,
    // used for url generation
    file,
) => {
    if(jsonContent) {
        if(customMerge) {
            data = customMerge(data, jsonContent)
        } else {
            data = {
                ...data,
                ...jsonContent,
            }
        }
    }

    if(fmContent && fmMap) {
        if(customMerge) {
            data = customMerge(data, fmMap(frontmatter(String(fmContent)), file))
        } else {
            data = {
                ...data,
                ...fmMap(frontmatter(String(fmContent)), file),
            }
        }
    }

    return data
}

export function twigDataHandler({data = {}, customMerge, json, fm, fmMap}) {
    return gulpData(function(file, cb) {
        let jsonContent
        if(json) {
            // todo: support async `json` fetch function
            const jsonFile = json(file.path)
            if(typeof jsonFile !== 'undefined') {
                jsonContent = JSON.parse(fs.readFileSync(jsonFile).toString())
            }
        }

        let fmContent
        if(fm && fmMap) {
            // todo: support async `fm` fetch function
            const fmFile = fm(file.path)
            if(typeof fmFile !== 'undefined') {
                fmContent = fs.readFileSync(fmFile).toString()
            }
        }
        // todo: add here or afterwards an optional `cb` to do something with the full merged page, additionally to any template rendering / beforehand?
        //       like a special `render page` flow, where in the end the template get's rendered, but also it is possible to mangle the template
        //       check if it could be build with `subpipe`
        cb(undefined, handleData(data, customMerge, jsonContent, fmContent, fmMap, file))
    })
}
