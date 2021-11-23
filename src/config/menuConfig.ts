import { getConfig } from "../utils";
import { BindingItem, TransientBindingItem } from "./bindingItem";

export type MaybeConfig<T> = T | string | undefined;

export interface WhichKeyMenuConfig {
    title?: string;
    delay: number;
    showIcons: boolean;
    showButtons: boolean;
    bindings: BindingItem[];
}

export interface TransientMenuConfig {
    title?: string;
    showIcons?: boolean;
    bindings: TransientBindingItem[];
}

export function resolveMaybeConfig<T>(b?: MaybeConfig<T>): T | undefined {
    if (typeof b === 'string') {
        return getConfig<T>(b);
    } else {
        return b;
    }
}
