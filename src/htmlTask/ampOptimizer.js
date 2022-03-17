import through2 from 'through2'

/**
 * @param {DomTransformer|undefined} ampOptimizerLib
 */
export function ampOptimizer(ampOptimizerLib) {
    return through2.obj((file, _, cb) => {
        try {
            if(!ampOptimizerLib) {
                cb(null, file)
                return
            }
            if(file.isBuffer()) {
                ampOptimizerLib.transformHtml(
                        file.contents.toString(),
                        {},
                    )
                    .then((optimizedHtml) => {
                        file.contents = Buffer.from(optimizedHtml)
                        cb(null, file)
                    })
                    .catch((e) => {
                        cb(e)
                    })
            } else {
                cb(new Error('ampOptimizer received invalid file'))
            }
        } catch(e) {
            cb(e)
        }
    })
}
