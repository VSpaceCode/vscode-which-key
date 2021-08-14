export const enum ActionType {
    Command = "command",
    Commands = "commands",
    Bindings = "bindings",
    Transient = "transient",
    Conditional = "conditional",
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
    type: ActionType;
    bindings?: BindingItem[];
}

export interface OverrideBindingItem extends CommandItem {
    keys: string | string[];
    position?: number;
    name?: string;
    icon?: string;
    type?: ActionType;
    bindings?: BindingItem[];
}

export interface TransientBindingItem extends CommandItem {
    key: string;
    name: string;
    icon?: string;
    exit?: boolean;
}

export interface BindingObject {
	type: ActionType;
	name: string;
	icon?: string;
	command?: string;
	commands?: string[],
	args?: any;
	bindings?: BindingMap;
}

export interface Layer {
    bindings: BindingMap;
}

export type BindingMap = Record<string, BindingObject | null>;
export type LayerMap = Record<string, Layer | null>;

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
