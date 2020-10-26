import { TaskFunction } from 'undertaker'

export type sassOutputStyle = 'nested' | 'expanded' | 'compact' | 'compressed'

/**
 * All options from sass, except: `file`, `data`, `outputStyle` and `importer`
 * @see https://github.com/sass/node-sass#options
 */
export type sassOptions = { [key: string]: any }

export function cssHandler(
    done: Function, outputStyle?: sassOutputStyle, options?: sassOptions,
    postImport?: boolean, postPrefix?: boolean, postNano?: boolean,
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
    outputStyle?: sassOutputStyle,
    options?: sassOptions
): TaskFunction
