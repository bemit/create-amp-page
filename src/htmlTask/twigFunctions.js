import path from 'path'
import fs from 'fs'

export const embedScript = (dist) => ({
    name: 'embedScript',
    func: (src) => {
        let file
        try {
            file = fs.readFileSync(path.join(dist, src))
        } catch(e) {
            if(process.env.NODE_ENV === 'production') {
                console.error(e)
                throw e
            } else if(e.code === 'ENOENT') {
                console.warn('embedScript file not found: ' + src)
            } else {
                console.warn(e)
            }
        }
        return file ? file.toString() : ''
    },
})
