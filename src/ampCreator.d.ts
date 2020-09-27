import { AmpCreatorOptions } from './AmpCreatorOptions'

export function ampCreator(options: AmpCreatorOptions): {
    images: Function
    clean: Function
    build: Function
    watch: Function
}
