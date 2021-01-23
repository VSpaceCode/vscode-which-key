import { QuickPickItem } from "vscode";
import { ActionType, BindingItem } from "../bindingItem";
import { Condition, evalCondition, getCondition, isConditionKeyEqual } from "../condition";
import { specializeBindingKey } from "../utils";

export interface MenuSelectionResult {
    items?: BaseMenuItem[],
    isTransient?: boolean,
    commands?: string[],
    args?: any,
    error?: string,
}

export abstract class BaseMenuItem implements QuickPickItem {
    key: string;
    name: string;
    constructor(key: string, name: string) {
        this.key = key;
        this.name = name;
    }

    get label() {
        return specializeBindingKey(this.key);
    }

    get description() {
        // Add tab so the description is aligned
        return `\t${this.name}`;
    }

    abstract select(args?: Condition): MenuSelectionResult;

    get(_key: string): BaseMenuItem | undefined {
        return undefined;
    }
}

abstract class BaseCollectionMenuItem extends BaseMenuItem {
    protected items: BaseMenuItem[];

    constructor(key: string, name: string, items: BaseMenuItem[]) {
        super(key, name);
        this.items = items;
    }

    get(key: string) {
        return this.items.find(i => i.key === key);
    }

    protected getIndex(key: string) {
        return this.items.findIndex(i => i.key === key);
    }
}

class BindingsMenuItem extends BaseCollectionMenuItem {
    constructor(item: BindingItem) {
        if (!item.bindings) {
            throw new MissingPropertyError("bindings", ActionType.Bindings);
        }
        const items = createMenuItems(item.bindings);
        super(item.key, item.name, items);
    }

    select(_args?: Condition): MenuSelectionResult {
        return {
            items: this.items,
            isTransient: false,
        };
    }
}

export class CommandsMenuItem extends BaseMenuItem {
    public commands: string[];
    public args?: any;

    constructor(item: BindingItem) {
        if (!item.commands) {
            throw new MissingPropertyError("commands", ActionType.Commands);
        }

        super(item.key, item.name);
        this.commands = item.commands;
        this.args = item.args;
    }

    select(_args?: Condition): MenuSelectionResult {
        return {
            commands: this.commands,
            args: this.args
        };
    }
}


class ConditionalsMenuItem extends BaseCollectionMenuItem {
    constructor(item: BindingItem) {
        if (!item.bindings) {
            throw new MissingPropertyError("bindings", ActionType.Conditional);
        }
        const items = createMenuItems(item.bindings);
        super(item.key, item.name, items);
    }

    get(key: string) {
        return this.items.find(i => isConditionKeyEqual(key, i.key));
    }

    protected getIndex(key: string) {
        return this.items.findIndex(i => isConditionKeyEqual(key, i.key));
    }

    eval(condition?: Condition) {
        return this.items.find(i => evalCondition(getCondition(i.key), condition));
    }

    select(args?: Condition): MenuSelectionResult {
        // Search the condition first. If no matches, find the first empty condition as else
        let match = this.eval(args) ?? this.eval(undefined);
        if (match) {
            return match.select(args);
        }

        const msg = "No conditions matched";
        console.warn(`${msg};key=${this.key};name=${this.name}`);
        return { error: msg };
    }
}

export class CommandMenuItem extends BaseMenuItem {
    public command: string;
    public args?: any;

    constructor(item: BindingItem) {
        if (!item.command) {
            throw new MissingPropertyError("command", ActionType.Command);
        }

        super(item.key, item.name);
        this.command = item.command;
        this.args = item.args;
    }

    select(_args?: Condition): MenuSelectionResult {
        return {
            commands: [this.command],
            args: this.args ? [this.args] : this.args
        };
    }
}

class TransientMenuItem extends BaseCollectionMenuItem {
    private commands?: string[];
    private args?: any;

    constructor(item: BindingItem) {
        if (!item.bindings) {
            throw new MissingPropertyError("bindings", ActionType.Transient);
        }
        const items = createMenuItems(item.bindings);

        super(item.key, item.name, items);
        if (item.commands) {
            this.commands = item.commands;
            this.args = item.args;
        } else if (item.command) {
            this.commands = [item.command];
            this.args = [item.args];
        }
    }

    select(_args?: Condition): MenuSelectionResult {
        return {
            items: this.items,
            isTransient: true,
            commands: this.commands,
            args: this.args
        };
    }
}

export class RootMenuItem extends BaseCollectionMenuItem {
    constructor(bindings: BindingItem[]) {
        const items = createMenuItems(bindings);
        super("", "", items);
    }

    select(_args?: Condition): MenuSelectionResult {
        return {
            items: this.items,
            isTransient: false,
        };
    }
}

function createMenuItem(bindingItem: BindingItem): BaseMenuItem {
    switch (bindingItem.type) {
        case ActionType.Command:
            return new CommandMenuItem(bindingItem);
        case ActionType.Commands:
            return new CommandsMenuItem(bindingItem);
        case ActionType.Bindings:
            return new BindingsMenuItem(bindingItem);
        case ActionType.Transient:
            return new TransientMenuItem(bindingItem);
        case ActionType.Conditional:
            return new ConditionalsMenuItem(bindingItem);
        default:
            throw new Error(`type ${bindingItem.type} is not supported`);
    }
}

function createMenuItems(bindingItems: BindingItem[]) {
    return bindingItems.map(createMenuItem);
}

class MissingPropertyError extends Error {
    name: string;
    constructor(propertyName: string, typeName: string) {
        super();
        this.name = `Property ${propertyName} is not defined for type ${typeName}`;
    }
}