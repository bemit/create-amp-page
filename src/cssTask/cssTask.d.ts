import { TaskFunction } from 'undertaker'

export function cssHandler(stream: NodeJS.WritableStream, done: Function): NodeJS.WritableStream

export interface MakeCssTaskConfig {
    paths: {
        styles: string
        dist: string
        distStyles: string
    }
}

export function makeCssTask(
    config: MakeCssTaskConfig,
    browsersync: any | { stream: Function }
): TaskFunction
