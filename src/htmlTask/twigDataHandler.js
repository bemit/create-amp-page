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
            jsonContent = JSON.parse(fs.readFileSync(json(file.path)).toString())
        }

        let fmContent
        if(fm && fmMap) {
            fmContent = fs.readFileSync(fm(file.path)).toString()
        }
        return handleData(data, customMerge, jsonContent, fmContent, fmMap, file)
    })
}
