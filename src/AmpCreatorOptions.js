export const getOptions = function getOptions(
    {
        // setting defaults and so on for some easier usages
        watchFolders = {},
        cleanFolders = [],
        watchOptions = {ignoreInitial: false},
        serveStaticMiddleware = [],
        ...options
    },
) {
    watchFolders = {...watchFolders}
    watchFolders.sass = watchFolders.sass || []
    watchFolders.twig = watchFolders.twig || []
    watchFolders.media = watchFolders.media || []
    return {watchFolders, cleanFolders, watchOptions, serveStaticMiddleware, ...options}
}
