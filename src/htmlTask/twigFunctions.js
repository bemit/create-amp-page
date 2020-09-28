const path = require('path')
const fs = require('fs')

exports.embedScript = (dist) => ({
    name: 'embedScript',
    func: (src) => {
        let file
        try {
            file = fs.readFileSync(path.join(dist, src))
        } catch(e) {
            if(process.env.NODE_ENV === 'production') {
                console.error(e)
                throw e
            } else {
                console.warn(e)
            }
        }
        return file ? file.toString() : ''
    },
})
