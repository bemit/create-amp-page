import through2 from 'through2'
import AmpOptimizer from '@ampproject/toolbox-optimizer'

let ampOptimizerRef = {current: null}
const ampOptimizerLib = AmpOptimizer.create()

export function ampOptimizer(doOptimize) {
    if(!ampOptimizerRef.current) {
        ampOptimizerRef.current = AmpOptimizer.create(typeof doOptimize === 'object' ? doOptimize : undefined)
    }
    return through2.obj(async (file, _, cb) => {
        if(doOptimize && file.isBuffer()) {
            const optimizedHtml = await ampOptimizerLib.transformHtml(
                file.contents.toString(),
                {},
            )
            file.contents = Buffer.from(optimizedHtml)
        }
        cb(null, file)
    })
}
