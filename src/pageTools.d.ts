import { FmMapFiles } from './AmpCreatorOptions'

export interface PageUrlMap {
    base: string
}

export interface PagesUrlsMap {
    [pageId: string]: {
        [env: string]: PageUrlMap
    }
}

export function getPageInfo(files: FmMapFiles, urls: PagesUrlsMap, pageId: string, pageEnv: string): {
    basePath: string
    pageBase: string
    pagePath: string
    urlMap: PageUrlMap
}

export function getPagesIndex(urls: PagesUrlsMap, pageEnv: string): {
    [pageId: string]: PageUrlMap
}
