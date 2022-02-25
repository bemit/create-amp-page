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
    mappedFiles,
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
            data = customMerge(data, fmMap(frontmatter(String(fmContent)), mappedFiles))
        } else {
            data = {
                ...data,
                ...fmMap(frontmatter(String(fmContent)), mappedFiles),
            }
        }
    }

    return data
}

export const loadJsonData = async (json, path, loader, failOnMissing = false) => {
    let jsonContent
    let jsonFile
    if(json) {
        jsonFile = json(path)
        try {
            if(typeof jsonFile !== 'undefined') {
                if(loader) {
                    jsonContent = await loader(jsonFile)
                } else {
                    const jsonFileStr = await new Promise((resolve, reject) => {
                        fs.readFile(jsonFile, (e, f) => {
                            if(e) {
                                if(failOnMissing) {
                                    reject(e)
                                    return
                                }

                                resolve(undefined)
                                return
                            }
                            resolve(f.toString())
                        })
                    })
                    if(typeof jsonFileStr === 'string') {
                        jsonContent = JSON.parse(jsonFileStr)
                    }
                }
            }
        } catch(e) {
            if(failOnMissing) {
                throw e
            }
        }
    }
    return {jsonContent, jsonFile}
}

export function twigDataHandler(
    {data = {}, customMerge, fmMap},
    collection,
) {
    const {
        fm, base, pageId,
        json, jsonLoader, jsonFailOnMissing,
        ...r
    } = collection
    return gulpData(async (file, cb) => {
        const {jsonContent, jsonFile} = await loadJsonData(json, file.path, jsonLoader, jsonFailOnMissing)

        let fmContent
        let fmFile
        if(fm && fmMap) {
            fmFile = fm(file.path)
            if(typeof fmFile !== 'undefined') {
                // todo: support async `fm` fetch function
                fmContent = fs.readFileSync(fmFile).toString()
            }
        }
        const mappedFiles = {
            ...r,
            tpl: file.path,
            cwd: file.cwd,
            pathData: jsonFile,
            pathFm: fmFile,
            base: base,
            pageId: pageId,
        }
        // todo: add here or afterwards an optional `cb` to do something with the full merged page, additionally to any template rendering / beforehand?
        //       like a special `render page` flow, where in the end the template get's rendered, but also it is possible to mangle the template
        //       check if it could be build with `subpipe`
        try {
            cb(
                undefined,
                handleData(
                    data, customMerge, jsonContent,
                    fmContent,
                    fmMap,
                    mappedFiles,
                ),
            )
        } catch(e) {
            cb(e)
        }
    })
}
