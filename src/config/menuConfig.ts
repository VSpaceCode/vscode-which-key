import { BindingItem, TransientBindingItem } from "./bindingItem";

export interface WhichKeyMenuConfig {
    title?: string,
    delay?: number,
    bindings: BindingItem[]
}

export interface TransientMenuConfig {
    title?: string,
    bindings: TransientBindingItem[]
}