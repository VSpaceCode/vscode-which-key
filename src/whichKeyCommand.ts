import { Disposable, workspace } from "vscode";
import { ActionType, BindingItem, OverrideBindingItem, toCommands, TransientBindingItem } from "./config/bindingItem";
import { CommandRelay } from "./commandRelay";
import { isConditionKeyEqual } from "./config/condition";
import { Commands, Configs, SortOrder } from "./constants";
import { showDescBindMenu } from "./menu/descBindMenu";
import { showWhichKeyMenu } from "./menu/whichKeyMenu";
import { WhichKeyMenuItem } from "./menu/whichKeyMenuItem";
import { IStatusBar } from "./statusBar";
import { WhichKeyConfig } from "./config/whichKeyConfig";
import { WhichKeyRepeater } from "./whichKeyRepeater";
import { createDescBindItems } from "./menu/descBindMenuItem";
import { getConfig } from "./utils";

export default class WhichKeyCommand {
    private statusBar: IStatusBar;
    private cmdRelay: CommandRelay;
    private repeater: WhichKeyRepeater;
    private bindingItems?: BindingItem[];
    private config?: WhichKeyConfig;
    private onConfigChangeListener?: Disposable;
    constructor(statusBar: IStatusBar, cmdRelay: CommandRelay) {
        this.statusBar = statusBar;
        this.cmdRelay = cmdRelay;
        this.repeater = new WhichKeyRepeater(statusBar, cmdRelay);
    }

    register(config: WhichKeyConfig) {
        this.unregister();
        this.config = config;

        const bindings = getCanonicalConfig(config);
        this.bindingItems = bindings.map(b => new WhichKeyMenuItem(b));

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
        this.onConfigChangeListener?.dispose();
        this.repeater.clear();
    }

    show() {
        const delay = getConfig<number>(Configs.Delay);
        const config = {
            bindings: this.bindingItems!, delay, title: this.config?.title
        };
        showWhichKeyMenu(this.statusBar, this.cmdRelay, this.repeater, config);
    }

    showBindings() {
        const items = createDescBindItems(this.bindingItems!);
        return showDescBindMenu(items, "Show Keybindings");
    }

    showPreviousActions() {
        return this.repeater.show();
    }

    repeatLastAction() {
        return this.repeater.repeatLastAction();
    }

    static show(bindings: BindingItem[], statusBar: IStatusBar, cmdRelay: CommandRelay) {
        const delay = getConfig<number>(Configs.Delay);
        const config = { bindings, delay };
        showWhichKeyMenu(statusBar, cmdRelay, undefined, config);
    }
}

function getSortOrder() {
    return getConfig<SortOrder>(Configs.SortOrder) ?? SortOrder.None;
}

function getCanonicalConfig(c: WhichKeyConfig) {
    let bindings = getConfig<BindingItem[]>(c.bindings) ?? [];
    if (c.overrides) {
        const overrides = getConfig<OverrideBindingItem[]>(c.overrides) ?? [];
        overrideBindingItems(bindings, overrides);
    }

    const sortOrder = getSortOrder();
    sortBindingsItems(bindings, sortOrder);

    return migrateBindings(bindings);
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

function indexOfKey(bindingItems: BindingItem[] | undefined, key: string, isCondition = false) {
    if (isCondition) {
        return bindingItems?.findIndex(i => isConditionKeyEqual(i.key, key)) ?? -1;
    } else {
        return bindingItems?.findIndex(i => i.key === key) ?? -1;
    }
}

function findBindings(items: BindingItem[], keys: string[]) {
    // Traverse to the last level
    let bindingItems: BindingItem[] | undefined = items;
    let isCondition = false;
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        const keyIndex = indexOfKey(bindingItems, key, isCondition);
        if (keyIndex === -1) {
            console.warn(`Key ${key} of ${keys.toString()} not found`);
            break;
        }

        isCondition = bindingItems?.[keyIndex].type === ActionType.Conditional;
        bindingItems = bindingItems?.[keyIndex]?.bindings;
    }

    return { bindingItems, isCondition };
}

function overrideBindingItems(items: BindingItem[], overrides: OverrideBindingItem[]) {
    for (const o of overrides) {
        try {
            const keys = (typeof o.keys === 'string') ? o.keys.split('.') : o.keys;
            const { bindingItems, isCondition } = findBindings(items, keys);

            if (bindingItems !== undefined) {
                const key = keys[keys.length - 1]; // last Key
                const index = indexOfKey(bindingItems, key, isCondition);

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

function migrateBindings(items: BindingItem[]) {
    const migrated: BindingItem[] = [];
    for (let i of items) {
        i = migrateTransient(i);
        if (i.bindings) {
            i.bindings = migrateBindings(i.bindings);
        }
        migrated.push(i);
    }
    return migrated;
}

function migrateTransient(item: BindingItem) {
    if (item.type === ActionType.Transient) {
        const { commands, args } = toCommands(item);
        commands.push(Commands.ShowTransient);
        args[commands.length - 1] = {
            title: item.name,
            bindings: convertToTransientBinding(item),
        };

        return {
            key: item.key,
            name: item.name,
            type: ActionType.Commands,
            commands,
            args,
        };
    }
    return item;
}

function convertToTransientBinding(item: BindingItem) {
    const transientBindings: TransientBindingItem[] = [];
    if (item.bindings) {
        for (const b of item.bindings) {
            if (b.type === ActionType.Command
                || b.type === ActionType.Commands) {
                transientBindings.push({
                    key: b.key,
                    name: b.name,
                    ...toCommands(b)
                });
            } else if (b.type === ActionType.Bindings) {
                transientBindings.push({
                    key: b.key,
                    name: b.name,
                    commands: [Commands.Show],
                    args: b.bindings,
                    exit: true,
                });
            } else if (b.type === ActionType.Transient) {
                transientBindings.push({
                    key: b.key,
                    name: b.name,
                    commands: [Commands.ShowTransient],
                    args: {
                        title: item.name,
                        bindings: convertToTransientBinding(item),
                    },
                    exit: true,
                });
            } else {
                // Not supported.
            }
        }
    }
    return transientBindings;
}