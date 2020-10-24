import { AmpCreatorOptions } from '../AmpCreatorOptions'
import { TaskFunction } from 'undertaker'

export interface MakeTwigHandlerConfig {
    twig: Pick<AmpCreatorOptions, 'twig'>
    paths: Pick<AmpCreatorOptions, 'paths'>
    ampOptimize: Pick<AmpCreatorOptions, 'ampOptimize'>
    minifyHtml: Pick<AmpCreatorOptions, 'minifyHtml'>
    cleanInlineCSS: Pick<AmpCreatorOptions, 'cleanInlineCSS'>
    cleanInlineCSSWhitelist: Pick<AmpCreatorOptions, 'cleanInlineCSSWhitelist'>
    cssInjectTag: Pick<AmpCreatorOptions, 'cssInjectTag'>
}

export function makeTwigHandler(config: MakeTwigHandlerConfig): NodeJS.WritableStream

export interface MakeHtmlTaskConfig extends MakeTwigHandlerConfig {
    twig: Pick<AmpCreatorOptions, 'twig'>
    paths: Pick<AmpCreatorOptions, 'paths'>
    collections: Pick<AmpCreatorOptions, 'collections'>
    browsersync: any | { stream: Function }
    additionalHtmlTasks: any[]
    imageminPlugins: Pick<AmpCreatorOptions, 'imageminPlugins'>
}

export function makeHtmlTask(config: MakeHtmlTaskConfig): TaskFunction
