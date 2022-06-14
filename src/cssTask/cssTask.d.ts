import { TaskFunction } from 'undertaker'
import { AmpCreatorOptions } from '../AmpCreatorOptions.js'

export type SassOutputStyle = 'nested' | 'expanded' | 'compact' | 'compressed'

/**
 * All options from sass, except: `file`, `data`, `outputStyle` and `importer`
 * @see https://github.com/sass/node-sass#options
 */
export type SassOptions = { [key: string]: any }

export function cssHandler(
    done: Function,
    sassConfig: AmpCreatorOptions['sassConfig'],
): NodeJS.ReadWriteStream

export interface MakeCssTaskConfig {
    paths: {
        styles: string
        dist: string
        distStyles: string
    }
}

export function makeCssTask(
    config: MakeCssTaskConfig,
    browsersync: any | { stream: Function },
    sassConfig: AmpCreatorOptions['sassConfig'],
): TaskFunction
