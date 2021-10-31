export const enum ActionType {
    Command = "command",
    Commands = "commands",
    Bindings = "bindings",
    Transient = "transient",
    Conditional = "conditional",
}

export const enum DisplayOption {
    Hidden = "hidden",
}

export interface CommandItem {
    command?: string;
    commands?: string[];
    args?: any;
}

export interface BindingItem extends CommandItem {
    key: string;
    name: string;
    icon?: string;
    display?: DisplayOption;
    type: ActionType;
    bindings?: BindingItem[];
}

export interface OverrideBindingItem extends CommandItem {
    keys: string | string[];
    position?: number;
    name?: string;
    icon?: string;
    display?: DisplayOption;
    type?: ActionType;
    bindings?: BindingItem[];
}

export interface TransientBindingItem extends CommandItem {
    key: string;
    name: string;
    icon?: string;
    display?: DisplayOption;
    exit?: boolean;
}

export function toBindingItem(o: any): BindingItem | undefined {
    if (typeof o === "object") {
        const config = o as Partial<BindingItem>;
        if (config.key && config.name && config.type) {
            return config as BindingItem;
        }
    }
    return undefined;
}

export function toCommands(b: CommandItem): {
    commands: string[];
    args: any;
} {
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
