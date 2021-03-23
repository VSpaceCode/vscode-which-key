import { getConfig } from "../utils";
import { BindingItem, TransientBindingItem } from "./bindingItem";

export type Bindings<T> = T[] | string;

export interface WhichKeyMenuConfig {
    title?: string;
    delay?: number;
    bindings: BindingItem[];
}

export interface TransientMenuConfig {
    title?: string;
    bindings: Bindings<TransientBindingItem>;
}

export function resolveBindings<T>(b: Bindings<T>): T[] {
    if (typeof b === 'string') {
        return getConfig<T[]>(b) ?? [];
    } else {
        return b;
    }
}