import { QuickPickItem } from "vscode";
import { ActionType, BindingItem, Condition, OverrideBindingItem } from "../bindingItem";
import { SortOrder } from "../constants";

export interface MenuSelectionResult {
    items?: BaseMenuItem[],
    isTransient?: boolean,
    commands?: string[],
    args?: any,
}

export abstract class BaseMenuItem implements QuickPickItem {
    key: string;
    name: string;
    constructor(key: string, name: string) {
        this.key = key;
        this.name = name;
    }

    get label() {
        return convertToMenuLabel(this.key);
    }

    get description() {
        // Add tab so the description is aligned
        return `\t${this.name}`;
    }

    abstract select(args?: Condition): MenuSelectionResult;
    sortItems(_order: SortOrder): void {
        // Nothing to sort
    }

    get(_key: string): BaseMenuItem | undefined {
        return undefined;
    }

    overrideItem(_overrides: OverrideBindingItem) {
        // Nothing to override by default
    }
}

abstract class BaseCollectionMenuItem extends BaseMenuItem {
    protected items: BaseMenuItem[];

    constructor(key: string, name: string, items: BaseMenuItem[]) {
        super(key, name);
        this.items = items;
    }

    sortItems(order: SortOrder): void {
        sortMenuItems(this.items, order);
        for (const item of this.items) {
            item.sortItems(order);
        }
    }

    get(key: string) {
        return this.items.find(i => i.key === key);
    }

    protected getIndex(key: string) {
        return this.items.findIndex(i => i.key === key);
    }

    overrideItem(o: OverrideBindingItem) {
        const keys = (typeof o.keys === 'string') ? o.keys.split('.') : o.keys;
        const key = keys[keys.length - 1];
        const index = this.getIndex(key);

        if (o.position === undefined) {
            const newItem = createMenuItemFromOverrides(o, key);
            if (index !== -1) {
                // replace the current item
                this.items.splice(index, 1, newItem);
            } else {
                // append if there isn't an existing binding
                this.items.push(newItem);
            }
        } else {
            if (o.position < 0) {
                // negative position, attempt to remove
                if (index !== -1) {
                    this.items.splice(index, 1);
                }
            } else {
                // Remove and replace
                if (index !== -1) {
                    this.items.splice(index, 1);
                }
                const newItem = createMenuItemFromOverrides(o, key);
                this.items.splice(o.position, 0, newItem);
            }
        }
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

class CommandsMenuItem extends BaseMenuItem {
    private commands: string[];
    private args?: any;

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

function evalCondition(stored?: Condition, evaluatee?: Condition) {
    if (evaluatee && stored) {
        let result = true;
        if (stored.when) {
            result = result && (stored.when === evaluatee.when);
        }
        if (stored.languageId) {
            result = result && (stored.languageId === evaluatee.languageId);
        }
        return result;
    }
    return false;
}

function isConditionEqual(condition1?: Condition, condition2?: Condition) {
    if (condition1 && condition2) {
        let result = true;
        result = result && (condition1.when === condition2.when);
        result = result && (condition1.languageId === condition2.languageId);
        return result;
    }
    // For if they are both undefined or null
    return condition1 === condition2;
}

function isConditionKeyEqual(key1?: string, key2?: string) {
    return isConditionEqual(getCondition(key1), getCondition(key2));
}

function getCondition(key?: string): Condition | undefined {
    if (key && key.length > 0) {
        const props = key.split(";");
        const r = props.reduce((result, prop) => {
            const [key, value] = prop.split(":");
            result[key] = value;
            return result;
        }, {} as Record<string, string>);
        return {
            when: r["when"],
            languageId: r["languageId"]
        };
    }
    return undefined;
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

        throw new Error("No conditions match!");
    }
}

class CommandMenuItem extends BaseMenuItem {
    private command: string;
    private args?: any;

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

    override(overrides: OverrideBindingItem[]) {
        for (const o of overrides) {
            try {
                const keys = (typeof o.keys === 'string') ? o.keys.split('.') : o.keys;
                let menuItem: BaseMenuItem | undefined = this;
                for (let i = 0; i < keys.length - 1; i++) {
                    const key = keys[i];
                    menuItem = menuItem?.get(key);
                    if (menuItem === undefined) {
                        console.warn(`Key ${key} of ${o.keys} not found`);
                        break;
                    }
                }
                menuItem?.overrideItem(o);
            } catch (e) {
                console.error(e);
            }
        }
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

// sort menu item in-place
function sortMenuItems(items: BaseMenuItem[], order: SortOrder) {
    if (order !== SortOrder.None) {
        if (order === SortOrder.Alphabetically) {
            items.sort((a, b) => a.key.localeCompare(b.key));
        } else if (order === SortOrder.NonNumberFirst) {
            items.sort((a, b) => {
                const regex = /^[0-9]/;
                const aStartsWithNumber = regex.test(a.key);
                const bStartsWithNumber = regex.test(b.key);
                if (aStartsWithNumber !== bStartsWithNumber) {
                    // Sort non-number first
                    return aStartsWithNumber ? 1 : -1;
                } else {
                    return a.key.localeCompare(b.key);
                }
            });
        }
    }
}

function createMenuItemFromOverrides(o: OverrideBindingItem, key: string) {
    if (o.name !== undefined && o.type !== undefined) {
        return createMenuItem({
            key: key,
            name: o.name,
            type: o.type,
            command: o.command,
            commands: o.commands,
            args: o.args,
            bindings: o.bindings,
        });
    } else {
        throw new Error('name or type of the override is undefined');
    }
}

function createMenuItems(bindingItems: BindingItem[]) {
    return bindingItems.map(createMenuItem);
}

export function convertToMenuLabel(s: string) {
    return s.replace(/ /g, '␣').replace(/\t/g, '↹');
}

class MissingPropertyError extends Error {
    name: string;
    constructor(propertyName: string, typeName: string) {
        super();
        this.name = `Property ${propertyName} is not defined for type ${typeName}`;
    }
}