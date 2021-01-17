'use strict'
const fs = require('fs')
const gulpData = require('gulp-data')
const frontmatter = require('front-matter')

const handleData = (
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
exports.handleData = handleData

exports.twigDataHandler = function twigDataHandler({data = {}, customMerge, json, fm, fmMap}) {
    return gulpData(function(file) {
        let jsonContent
        if(json) {
            const jsonFile = json(file.path)
            if(typeof jsonFile !== 'undefined') {
                jsonContent = JSON.parse(fs.readFileSync(jsonFile).toString())
            }
        }

        let fmContent
        if(fm && fmMap) {
            const fmFile = fm(file.path)
            if(typeof fmFile !== 'undefined') {
                fmContent = fs.readFileSync(fmFile).toString()
            }
        }
        return handleData(data, customMerge, jsonContent, fmContent, fmMap, file)
    })
}
