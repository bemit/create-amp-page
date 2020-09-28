import { Gulp } from 'gulp'
import { TaskFunction } from 'undertaker'
import { AmpCreatorOptions } from './AmpCreatorOptions'

export interface AmpTasks {
    // deprecated: use `media` instead
    images: TaskFunction
    media: TaskFunction
    css: TaskFunction
    html: TaskFunction
    clean: TaskFunction
    build: TaskFunction
    // the pure `build`, without clean
    builder: TaskFunction
    watch: TaskFunction
    // the pure `watch`, without clean and and without browsersync
    watcher: TaskFunction
}

export type WrapFunction = (
    gulp: Gulp,
    tasks: AmpTasks,
    options: AmpCreatorOptions,
    internals: {
        // todo: correct typings
        makeHtmlTask: Function
        makeMediaTask: Function
        makeCssTask: Function
        makeCopyTask: Function
        browsersync: { stream: Function }
        browserSyncSetup: (done: () => void) => void
        gulpCopyTasks: {
            build: TaskFunction[]
            watch: (watchOptions: Object) => void
        }
    }
) => Object

export function ampCreator(options: AmpCreatorOptions, wrap?: WrapFunction): AmpTasks
