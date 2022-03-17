import { AmpCreatorOptions, AmpCreatorOptionsPaths } from '../AmpCreatorOptions'
import { TaskFunction } from 'undertaker'
import * as stream from 'stream'

export interface MakeTwigHandlerConfig {
    twig: AmpCreatorOptions['twig']
    paths: AmpCreatorOptionsPaths
    dist: string
    srcMedia: string
    distMedia: string
    ampOptimizer: AmpCreatorOptions['ampOptimizer']
    minifyHtml: AmpCreatorOptions['minifyHtml']
    minifyHtmlOptions: AmpCreatorOptions['minifyHtmlOptions']
    cleanInlineCSS: AmpCreatorOptions['cleanInlineCSS']
    cleanInlineCSSOptions: AmpCreatorOptions['cleanInlineCSSOptions']
    cleanInlineCSSWhitelist: AmpCreatorOptions['cleanInlineCSSWhitelist']
    cssFailOnSize?: boolean
    cssSizeLimit?: number
    cssInjectTag: AmpCreatorOptions['cssInjectTag']
    cssBuffer?: stream.Transform
}

export function makeTwigHandler(config: MakeTwigHandlerConfig): () => Promise<() => NodeJS.ReadWriteStream>

export interface MakeHtmlTaskConfig extends MakeTwigHandlerConfig {
    twig: AmpCreatorOptions['twig']
    paths: AmpCreatorOptionsPaths
    collections: AmpCreatorOptions['collections']
    browsersync: any | { stream: Function }
    additionalHtmlTasks: any[]
    imageminPlugins: AmpCreatorOptions['imageminPlugins']
}

export function makeHtmlTask(config: MakeHtmlTaskConfig): TaskFunction
