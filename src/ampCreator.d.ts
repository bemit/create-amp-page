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

export type SetupFunction = (options: AmpCreatorOptions) => AmpCreatorOptions

/**
 * Creates ready to use tasks for gulp using the specified options
 *
 * @param options base options, e.g. paths
 * @param setup for easier dynamic setup of e.g. twig options, using the defined base options
 * @param wrap for reuse of base functions, internal gulp instances, for custom gulp functions
 */
export function ampCreator(options: AmpCreatorOptions, setup?: SetupFunction | undefined, wrap?: WrapFunction): AmpTasks
