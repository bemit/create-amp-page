import fs from 'fs'
import gulpData from 'gulp-data'
import frontmatter from 'front-matter'

const AsyncFunction = (async () => {
}).constructor

export const handleData = async (
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
        const fmData = frontmatter(String(fmContent))
        let fmMapResult = undefined
        if(fmMap instanceof AsyncFunction || fmMap instanceof Promise) {
            fmMapResult = await fmMap(fmData, mappedFiles, data)
        } else {
            fmMapResult = fmMap(fmData, mappedFiles, data)
        }
        if(customMerge) {
            data = customMerge(data, fmMapResult)
        } else {
            data = {
                ...data,
                ...fmMapResult,
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
                return Promise.reject(e)
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
        fm, fmLoad, base, pageId,
        json, jsonLoader, jsonFailOnMissing,
        ...r
    } = collection
    return gulpData((file, cb) => {
        loadJsonData(json, file.path, jsonLoader, jsonFailOnMissing)
            .then(({jsonContent, jsonFile}) => {
                let fmContent
                let pathFm
                if(fm && fmMap) {
                    pathFm = fm(file.path)
                    if(typeof pathFm !== 'undefined') {
                        if(fmLoad) {
                            return fmLoad(pathFm).then((fmContent) => {
                                return {jsonFile, pathFm, fmContent, jsonContent}
                            })
                        } else {
                            return new Promise((resolve, reject) => {
                                fs.readFile(pathFm, (err, data1) => {
                                    if(err) {
                                        reject(err)
                                        return
                                    }
                                    resolve({jsonFile, pathFm, fmContent: data1.toString(), jsonContent})
                                })
                            })
                        }
                    }
                }
                return {jsonFile, pathFm, jsonContent}
            })
            .then(({jsonFile, pathFm, fmContent, jsonContent}) => {
                const mappedFiles = {
                    ...r,
                    tpl: file.path,
                    cwd: file.cwd,
                    pathData: jsonFile,
                    pathFm: pathFm,
                    base: base,
                    pageId: pageId,
                    pagesByTpl: true,
                }
                // todo: add here or afterwards an optional `cb` to do something with the full merged page, additionally to any template rendering / beforehand?
                //       like a special `render page` flow, where in the end the template get's rendered, but also it is possible to mangle the template
                //       check if it could be build with `subpipe`
                handleData(
                    data, customMerge, jsonContent,
                    fmContent,
                    fmMap,
                    mappedFiles,
                )
                    .then((fullData) => {
                        cb(undefined, fullData)
                    })
                    .catch((e) => {
                        cb(e || new Error('handleData has failed'))
                    })
            })
            .catch((e) => {
                cb(e)
            })
    })
}
