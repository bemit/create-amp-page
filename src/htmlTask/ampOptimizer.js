const through2 = require('through2')

const AmpOptimizer = require('@ampproject/toolbox-optimizer')
let ampOptimizerRef = {current: null}
const ampOptimizer = AmpOptimizer.create()

exports.ampOptimizer = function(doOptimize) {
    if(!ampOptimizerRef.current) {
        ampOptimizerRef.current = AmpOptimizer.create(typeof doOptimize === 'object' ? doOptimize : undefined)
    }
    return through2.obj(async (file, _, cb) => {
        if(doOptimize && file.isBuffer()) {
            const optimizedHtml = await ampOptimizer.transformHtml(
                file.contents.toString(),
                {},
            )
            file.contents = Buffer.from(optimizedHtml)
        }
        cb(null, file)
    })
}
