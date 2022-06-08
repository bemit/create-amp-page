import path from 'path'

export function getPageInfo(file, urls, pageId, pageEnv) {
    const basePath = file.base.replace('\\', '/')
    const extensions = ['twig', 'md']
    const relPathRaw = extensions.reduce((p, ext) =>
            p.replace(new RegExp('.' + ext + '$'), ''),
        path.basename(file.pagesByTpl ? file.tpl : file.pathFm),
    )

    const relPath = basePath + (relPathRaw === 'index' ? '' : relPathRaw)
    if(!urls[pageId] || !urls[pageId][pageEnv]) {
        throw new Error('getPageInfo no urlMap found for page `' + pageId + '` in env `' + pageEnv + '`')
    }
    const urlMap = urls[pageId][pageEnv]
    const pageBase = urlMap.base
    const pagePath = urlMap.path ? urlMap.path(relPath) : relPath

    return {
        basePath,
        pageBase,
        pagePath,
        urlMap,
    }
}

export function getPagesIndex(urls, pageEnv) {
    return Object.keys(urls).reduce((all, urlId) => ({
        ...all,
        [urlId]: urls[urlId][pageEnv],
    }), {})
}
