'use strict'
const path = require('path')
const map = require('map-stream')
const {handleData} = require('./twigDataHandler')

exports.twigMultiLoad = function(
    {data = {}, customMerge, fmMap},
    tpl,
) {
    function applyMatterGetTpl(file, cb) {
        file.data = handleData(data, customMerge, undefined, file.contents.toString(), fmMap, file)
        file.pathData = file.path
        file.path = path.resolve(file.cwd, tpl)
        cb(null, file)
    }

    return map(applyMatterGetTpl)
}

exports.twigMultiSave = function(ext = '.md') {
    function getPagePath(file, cb) {
        file.path = file.pathData.replace(new RegExp(ext), '.html')
        cb(null, file)
    }

    return map(getPagePath)
}
