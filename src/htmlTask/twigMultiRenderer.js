import path from 'path'
import map from 'map-stream'
import {handleData, loadJsonData} from './twigDataHandler.js'

export function twigMultiLoad(
    {data = {}, customMerge, fmMap},
    collection = {},
) {
    const {
        tpl, base, pageId,
        json, jsonLoader, jsonFailOnMissing,
        ...r
    } = collection

    const applyMatterGetTpl = (file, cb) => {
        new Promise(async (resolve, reject) => {
            try {
                const {jsonContent, jsonFile} = await loadJsonData(json, file.path, jsonLoader, jsonFailOnMissing)
                const mappedFiles = {
                    ...r,
                    base: base,
                    tpl: path.resolve(file.cwd, tpl),
                    pathData: jsonFile,
                    pathFm: file.path.slice(file.cwd.length + 1),
                    cwd: file.cwd,
                    pageId: pageId,
                }
                // switch to the template handler path, after this custom frontmatter handler
                file.pathFm = file.path
                file.path = path.resolve(file.cwd, tpl)
                file.base = path.dirname(file.path)
                file.data = handleData(
                    data, customMerge, jsonContent,
                    file.contents.toString(),
                    fmMap,
                    mappedFiles,
                )
                resolve(file)
            } catch(e) {
                reject(e)
            }
        })
            .then((file) => {
                cb(null, file)
            })
            .catch(e => {
                cb(e)
            })
    }

    return map(applyMatterGetTpl)
}

export function twigMultiSave(ext = '.md', extOut = '.html') {

    function getPagePath(file, cb) {
        // switch to the save handler path, using output file
        file.base = path.dirname(file.path)
        file.path = path.join(file.base, path.basename(file.pathFm).replace(new RegExp(ext), extOut))
        cb(null, file)
    }

    return map(getPagePath)
}
