import path from 'path'

export function getPageInfo(files, urls, pageId, pageEnv) {
    const basePath = files.base.replace('\\', '/')
    const extensions = ['twig', 'md']
    const relPathRaw = extensions.reduce((p, ext) =>
            p.replace(new RegExp('.' + ext + '$'), ''),
        path.basename(files.pagesByTpl ? files.tpl : files.pathFm),
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
