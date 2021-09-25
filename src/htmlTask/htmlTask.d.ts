import { AmpCreatorOptions } from '../AmpCreatorOptions'
import { TaskFunction } from 'undertaker'
import * as stream from 'stream'

export interface MakeTwigHandlerConfig {
    twig: AmpCreatorOptions['twig']
    paths: AmpCreatorOptions['paths']
    ampOptimize: AmpCreatorOptions['ampOptimize']
    minifyHtml: AmpCreatorOptions['minifyHtml']
    cleanInlineCSS: AmpCreatorOptions['cleanInlineCSS']
    cleanInlineCSSWhitelist: AmpCreatorOptions['cleanInlineCSSWhitelist']
    cssInjectTag: AmpCreatorOptions['cssInjectTag']
    cssBuffer?: stream.Transform
}

export function makeTwigHandler(config: MakeTwigHandlerConfig): () => Promise<() => NodeJS.ReadWriteStream>

export interface MakeHtmlTaskConfig extends MakeTwigHandlerConfig {
    twig: AmpCreatorOptions['twig']
    paths: AmpCreatorOptions['paths']
    collections: AmpCreatorOptions['collections']
    browsersync: any | { stream: Function }
    additionalHtmlTasks: any[]
    imageminPlugins: AmpCreatorOptions['imageminPlugins']
}

export function makeHtmlTask(config: MakeHtmlTaskConfig): TaskFunction
