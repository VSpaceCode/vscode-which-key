export const enum ActionType {
    Command = "command",
    Commands = "commands",
    Bindings = "bindings",
    Transient = "transient",
    Conditional = "conditional",
}

export interface BindingItem {
    key: string;
    name: string;
    type: ActionType,
    command?: string,
    commands?: string[],
    args?: any,
    bindings?: BindingItem[],
}

export interface OverrideBindingItem {
    keys: string | string[];
    position?: number;
    name?: string;
    type?: ActionType,
    command?: string,
    commands?: string[],
    args?: any,
    bindings?: BindingItem[],
}

export interface TransientBindingItem {
    key: string,
    name: string,
    commands?: string[],
    args?: any,
    exit?: boolean,
}

export interface TransientMenuConfig {
    title?: string,
    bindings: TransientBindingItem[]
}

export function toBindingItem(o: any) {
    if (typeof o === "object") {
        const config = o as Partial<BindingItem>;
        if (config.key && config.name && config.type) {
            return config as BindingItem;
        }
    }
    return undefined;
}