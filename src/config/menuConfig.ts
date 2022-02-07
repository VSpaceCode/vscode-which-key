import { getConfig } from "../utils";
import { BindingItem, TransientBindingItem } from "./bindingItem";

export type MaybeConfig<T> = T | string | undefined;

export interface WhichKeyMenuConfig {
    title?: string;
    delay: number;
    showIcons: boolean;
    showButtons: boolean;
    useFullWidthCharacters: boolean;
    bindings: BindingItem[];
}

export interface TransientMenuConfig {
    title?: string;
    showIcons?: boolean;
    useFullWidthCharacters?: boolean;
    bindings: TransientBindingItem[];
}

export function resolveMaybeConfig<T>(b?: MaybeConfig<T>): T | undefined {
    if (typeof b === "string") {
        return getConfig<T>(b);
    } else {
        return b;
    }
}
