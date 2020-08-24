import { QuickPickItem } from 'vscode';
import { ActionType, BindingItem, OverrideBindingItem, ConditionalBindingItem } from "../bindingItem";
import { SortOrder } from '../constants';

export default class MenuItem implements QuickPickItem {
    name: string;
    key: string;
    type: ActionType;
    command?: string;
    commands?: string[];
    items?: MenuItem[];
    args?: any;
    private conditionals?: ConditionalBindingItem[];

    private constructor(item: {
        name: string,
        key: string,
        type: ActionType,
        bindings?: BindingItem[],
        command?: string,
        commands?: string[],
        args?: any,
        conditionals?: ConditionalBindingItem[],
    }) {
        this.name = item.name;
        this.key = item.key;
        this.type = item.type;
        this.command = item.command;
        this.commands = item.commands;
        this.args = item.args;
        this.conditionals = item.conditionals;
        if (this.type === ActionType.Bindings && item.bindings) {
            this.items = MenuItem.createMenuItems(item.bindings);
        } else if (this.type === ActionType.Transient && item.bindings) {
            this.items = MenuItem.createMenuItems(item.bindings);
        }
    }

    getConditionalMenu(when?: string, languageId?: string) {
        if (this.conditionals) {
            let menu = this.conditionals.find(c => {
                if (c.condition) {
                    let result = true;
                    if (c.condition.when) {
                        result = result && (c.condition.when === when);
                    }
                    if (c.condition.languageId) {
                        result = result && (c.condition.languageId === languageId);
                    }
                    return result;
                }
                return false;
            });
            // Not match, find the first empty condition as else
            menu = menu ?? this.conditionals.find(c => c.condition === undefined);
            if (menu) {
                // Lazy creation of conditional menu
                return new MenuItem({
                    name: menu.name ?? this.name,
                    key: this.key,
                    type: menu.type as unknown as ActionType,
                    command: menu.command,
                    commands: menu.commands,
                    args: menu.args,
                    bindings: menu.bindings,
                });
            }
        }
        return undefined;
    }

    get label() {
        return convertToMenuLabel(this.key);
    }

    get description() {
        // Add tab so the description is aligned
        return `\t${this.name}`;
    }

    static createMenuItems(bindingItems: BindingItem[]) {
        return bindingItems.map(i => new MenuItem(i));
    }

    static overrideMenuItems(
        items?: MenuItem[],
        overrides?: OverrideBindingItem[]) {
        overrides?.forEach(o => {
            try {
                const keys = (typeof o.keys === 'string') ? o.keys.split('.') : o.keys;

                // Traverse to the last level
                let menuItems = items;
                for (let i = 0; i < keys.length - 1; i++) {
                    const key = keys[i];
                    const keyIndex = menuItems?.findIndex(i => i.key === key);
                    if (keyIndex === undefined || keyIndex === -1) {
                        console.warn(`Key ${key} of ${o.keys} not found`);
                        break;
                    }
                    menuItems = menuItems?.[keyIndex]?.items;
                }

                if (menuItems !== undefined) {
                    const key = keys[keys.length - 1];
                    const index = menuItems.findIndex(i => i.key === key);

                    if (o.position === undefined) {
                        const newItem = MenuItem.createFromOverride(o, key);
                        if (index !== -1) {
                            // replace the current item
                            menuItems.splice(index, 1, newItem);
                        } else {
                            // append if there isn't an existing binding
                            menuItems.push(newItem);
                        }
                    } else {
                        if (o.position < 0) {
                            // negative position, attempt to remove
                            if (index !== -1) {
                                menuItems.splice(index, 1);
                            }
                        } else {
                            // Remove and replace
                            if (index !== -1) {
                                menuItems.splice(index, 1);
                            }
                            const newItem = MenuItem.createFromOverride(o, key);
                            menuItems.splice(o.position, 0, newItem);
                        }
                    }
                }
            } catch (e) {
                console.error(e);
            }
        });
    }

    static sortMenuItems(items: MenuItem[] | undefined, order: SortOrder) {
        if (items && order !== SortOrder.None) {

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

            for (const item of items) {
                MenuItem.sortMenuItems(item.items, order);
            }
        }
    }

    static createFromBinding(item: BindingItem) {
        return new MenuItem(item);
    }

    static createFromOverride(o: OverrideBindingItem, key: string) {
        if (o.name !== undefined && o.type !== undefined) {
            return new MenuItem({
                key: key,
                name: o.name,
                type: o.type,
                command: o.command,
                commands: o.commands,
                args: o.args,
                bindings: o.bindings,
                conditionals: o.conditionals
            });
        } else {
            throw new Error('name or type of the override is undefined');
        }
    }
}

export function convertToMenuLabel(s: string) {
    return s.replace(/ /g, '␣').replace(/\t/g, '↹');
}