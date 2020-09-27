'use strict'
const fs = require('fs')
const gulpData = require('gulp-data')
const frontmatter = require('front-matter')

exports.twigDataHandler = function twigDataHandler({data = {}, customMerge, json, fm, fmMap}) {
    return gulpData(function(file) {
        if(json) {
            if(customMerge) {
                data = this.customMerge(data, JSON.parse(fs.readFileSync(json(file.path))))
            } else {
                data = {
                    ...data,
                    ...JSON.parse(fs.readFileSync(json(file.path))),
                }
            }
        }

        if(fm && fmMap) {
            const content = frontmatter(String(fs.readFileSync(fm(file.path))))
            if(customMerge) {
                data = this.customMerge(data, fmMap(content, file.path))
            } else {
                data = {
                    ...data,
                    ...fmMap(content, file.path),
                }
            }
        }

        return data
    })
}
