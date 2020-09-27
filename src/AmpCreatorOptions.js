exports.getOptions = function getOptions({watchFolders = {}, ...options}) {
    watchFolders = {...watchFolders}
    watchFolders.sass = watchFolders.sass || []
    watchFolders.twig = watchFolders.twig || []
    watchFolders.media = watchFolders.media || []
    return {watchFolders, ...options}
}
