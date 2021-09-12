import through2 from 'through2'
// needed for "typing"
import stream from 'stream'

/**
 * This `subpipe` code was based upon https://github.com/jrop/subpipe
 * and optimized for a more modern usage within this library.
 * Added the possibility for conditional subpipes
 * @author ISC License (ISC) Copyright (c) 2016, Jonathan Apodaca jrapodaca@gmail.com
 * @author MIT License, Copyright 2020, Michael Becker michael@bemit.codes
 */

/**
 * @param {function(stream: NodeJS.ReadWriteStream)} streamPiper The function to call twice
 * @param {Function[]|boolean[]|boolean|Function} conditions only when true / all eval to true, the subpipe is applied
 * @return {NodeJS.ReadWriteStream}
 */
export function subpipe(streamPiper, conditions = []) {
    const head = through2.obj(function(f, enc, done) {
        done(null, f)
    })

    let usePiper = true
    if(typeof conditions === 'boolean') {
        usePiper = conditions
    } else if(typeof conditions === 'function') {
        usePiper = conditions()
    } else if(Array.isArray(conditions)) {
        usePiper = conditions.reduce((isValid, condition) => {
            if(!isValid) return isValid
            if(typeof condition === 'boolean') {
                return condition
            } else if(typeof condition === 'function') {
                return condition()
            }
        }, usePiper)
    }

    const tail = usePiper ? streamPiper(head) : head

    let tailEnded = false
    tail.on('end', function() {
        tailEnded = true
    })

    const stream = through2.obj(
        (file, enc, callback) => {
            head.write(file)
            callback()
        },
        function flush(callback) {
            if(!tailEnded) {
                tail.on('end', () => {
                    callback()
                })
            } else {
                callback()
            }

            head.end()
        },
    )

    tail.on('data', function(data) {
        stream.push(data)
    })
    tail.on('error', function(e) {
        stream.emit('error', e)
    })

    return stream
}
