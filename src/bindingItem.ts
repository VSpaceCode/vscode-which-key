export const enum ActionType {
    Command = "command",
    Commands = "commands",
    Bindings = "bindings",
    Transient = "transient",
    Conditional = "conditional",
}

export type ConditionalActionType = ActionType.Bindings
    | ActionType.Command
    | ActionType.Commands
    | ActionType.Transient;

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

export type Condition = {
    when?: string,
    languageId?: string,
};

export function toBindingItem(o: any) {
    if (typeof o === "object") {
        const config = o as Partial<BindingItem>;
        if (config.key && config.name && config.type) {
            return config as BindingItem;
        }
    }
    return undefined;
}