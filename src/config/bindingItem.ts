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

export function toBindingItem(o: any) {
    if (typeof o === "object") {
        const config = o as Partial<BindingItem>;
        if (config.key && config.name && config.type) {
            return config as BindingItem;
        }
    }
    return undefined;
}

export function toCommands(b: BindingItem) {
    let commands: string[];
    let args;
    if (b.commands) {
        commands = b.commands;
        args = b.args;
    } else if (b.command) {
        commands = [b.command];
        args = [b.args];
    } else {
        commands = [];
        args = [];
    }

    return { commands, args };
}