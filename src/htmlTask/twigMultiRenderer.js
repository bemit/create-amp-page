import path from 'path'
import map from 'map-stream'
import {handleData, loadJsonData} from './twigDataHandler.js'

export function twigMultiLoad(
    {data = {}, customMerge, fmMap},
    collection = {},
) {
    const {
        tpl, base,
        json, jsonLoader, jsonFailOnMissing,
    } = collection

    const applyMatterGetTpl = (file, cb) => {
        new Promise(async (resolve) => {
            const {jsonContent, jsonFile} = await loadJsonData(json, file.path, jsonLoader, jsonFailOnMissing)
            const mappedFiles = {
                tpl: path.resolve(file.cwd, tpl),
                //relative: string,
                //base: path.dirname(path.resolve(file.cwd, tpl)),
                cwd: file.cwd,
                pathData: jsonFile,
                pathFm: file.path.slice(file.cwd.length + 1),
                isCollection: true,
                base: base,
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
        })
            .then((file) => {
                cb(null, file)
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
