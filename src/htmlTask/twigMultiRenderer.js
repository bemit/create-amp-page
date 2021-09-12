import path from 'path'
import map from 'map-stream'
import {handleData} from './twigDataHandler.js'

export function twigMultiLoad(
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

export function twigMultiSave(ext = '.md') {
    function getPagePath(file, cb) {
        file.path = file.pathData.replace(new RegExp(ext), '.html')
        cb(null, file)
    }

    return map(getPagePath)
}
