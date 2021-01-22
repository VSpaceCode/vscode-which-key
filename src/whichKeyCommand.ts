import { Disposable, workspace } from "vscode";
import { BindingItem, OverrideBindingItem } from "./bindingItem";
import { ConfigKey, Configs, contributePrefix, SortOrder } from "./constants";
import { bindingsToMenuItems } from "./descBind";
import KeyListener from "./keyListener";
import { WhichKeyMenu } from "./menu/menu";
import { BaseMenuItem, RootMenuItem } from "./menu/menuItem";
import { showDescBindMenu } from "./menu/descBindMenu";
import { IStatusBar } from "./statusBar";
import { WhichKeyConfig } from "./whichKeyConfig";

export default class WhichKeyCommand {
    private statusBar: IStatusBar;
    private keyListener: KeyListener;
    private bindingItems?: BindingItem[];
    private root?: RootMenuItem;
    private config?: WhichKeyConfig;
    private onConfigChangeListener?: Disposable;
    constructor(statusBar: IStatusBar, keyListener: KeyListener) {
        this.keyListener = keyListener;
        this.statusBar = statusBar;
    }

    register(config: WhichKeyConfig) {
        this.unregister();
        this.config = config;

        const bindings = getCanonicalConfig(config);
        if (bindings) {
            this.root = new RootMenuItem(bindings);
        }
        this.bindingItems = bindings;

        this.onConfigChangeListener = workspace.onDidChangeConfiguration((e) => {
            if (
                e.affectsConfiguration(Configs.SortOrder) ||
                e.affectsConfiguration(config.bindings) ||
                (config.overrides && e.affectsConfiguration(config.overrides))
            ) {
                this.unregister();
                this.register(config);
            }
        }, this);
    }

    unregister() {
        this.root = undefined;
        this.onConfigChangeListener?.dispose();
    }

    show() {
        const items = this.root?.select().items;
        if (items) {
            return showMenu(this.statusBar, this.keyListener, items, false, this.config?.title);
        } else {
            throw new Error("No bindings are available");
        }
    }

    showBindings() {
        const items = bindingsToMenuItems(this.bindingItems ?? [], []);
        return showDescBindMenu(items, "Show Keybindings");
    }

    static show(bindings: BindingItem[], statusBar: IStatusBar, keyWatcher: KeyListener) {
        const items = new RootMenuItem(bindings).select().items!;
        return showMenu(statusBar, keyWatcher, items, false);
    }
}

function showMenu(statusBar: IStatusBar, keyListener: KeyListener, items: BaseMenuItem[], isTransient: boolean, title?: string) {
    const delay = workspace.getConfiguration(contributePrefix).get<number>(ConfigKey.Delay) ?? 0;
    return WhichKeyMenu.show(statusBar, keyListener, items, isTransient, delay, title);
}

function getConfig<T>(section: string) {
    // Get the minimal scope
    let filterSection: string | undefined = undefined;
    let lastSection: string = section;
    const idx = section.lastIndexOf('.');
    if (idx !== -1) {
        filterSection = section.substring(0, idx);
        lastSection = section.substring(idx + 1);
    }

    return workspace.getConfiguration(filterSection).get<T>(lastSection);
}

function getSortOrder() {
    return getConfig<SortOrder>(Configs.SortOrder) ?? SortOrder.None;
}

function getCanonicalConfig(c: WhichKeyConfig) {
    const bindings = getConfig<BindingItem[]>(c.bindings) ?? [];
    if (c.overrides) {
        const overrides = getConfig<OverrideBindingItem[]>(c.overrides) ?? [];
        overrideBindingItems(bindings, overrides);
    }

    const sortOrder = getSortOrder();
    sortBindingsItems(bindings, sortOrder);

    return bindings;
}

function convertOverride(key: string, o: OverrideBindingItem) {
    if (o.name !== undefined && o.type !== undefined) {
        return {
            key: key,
            name: o.name,
            type: o.type,
            command: o.command,
            commands: o.commands,
            args: o.args,
            bindings: o.bindings,
        };
    } else {
        throw new Error('name or type of the override is undefined');
    }
}

function findBindings(items: BindingItem[], keys: string[]) {
    // Traverse to the last level
    let bindingItems: BindingItem[] | undefined = items;
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        const keyIndex: number | undefined = bindingItems?.findIndex(i => i.key === key);
        if (keyIndex === undefined || keyIndex === -1) {
            console.warn(`Key ${key} of ${keys.toString()} not found`);
            break;
        }
        bindingItems = bindingItems?.[keyIndex]?.bindings;
    }

    return bindingItems;
}

function overrideBindingItems(items: BindingItem[], overrides: OverrideBindingItem[]) {
    for (const o of overrides) {
        try {
            const keys = (typeof o.keys === 'string') ? o.keys.split('.') : o.keys;
            const bindingItems = findBindings(items, keys);

            if (bindingItems !== undefined) {
                const key = keys[keys.length - 1]; // last Key
                const index = bindingItems.findIndex(i => i.key === key);

                if (o.position === undefined) {
                    const newItem = convertOverride(key, o);
                    if (index !== -1) {
                        // replace the current item
                        bindingItems.splice(index, 1, newItem);
                    } else {
                        // append if there isn't an existing binding
                        bindingItems.push(newItem);
                    }
                } else {
                    if (o.position < 0) {
                        // negative position, attempt to remove
                        if (index !== -1) {
                            bindingItems.splice(index, 1);
                        }
                    } else {
                        // Remove and replace
                        if (index !== -1) {
                            bindingItems.splice(index, 1);
                        }
                        const newItem = convertOverride(key, o);
                        bindingItems.splice(o.position, 0, newItem);
                    }
                }
            }
        } catch (e) {
            console.error(e);
        }
    }
}

// in place sort
function sortBindingsItems(items: BindingItem[] | undefined, order: SortOrder) {
    if (!items || order === SortOrder.None) {
        return;
    }

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
        sortBindingsItems(item.bindings, order);
    }
}
