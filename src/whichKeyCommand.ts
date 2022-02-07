import { Disposable, workspace } from "vscode";
import { getSortComparer } from "./bindingComparer";
import { CommandRelay } from "./commandRelay";
import {
    ActionType,
    BindingItem,
    OverrideBindingItem,
    toCommands,
    TransientBindingItem,
} from "./config/bindingItem";
import { isConditionKeyEqual } from "./config/condition";
import { WhichKeyConfig } from "./config/whichKeyConfig";
import { Commands, Configs, SortOrder } from "./constants";
import { showWhichKeyMenu } from "./menu/whichKeyMenu";
import { StatusBar } from "./statusBar";
import { getConfig } from "./utils";
import { WhichKeyRepeater } from "./whichKeyRepeater";

function indexOfKey(
    bindingItems: BindingItem[] | undefined,
    key: string,
    isCondition = false
): number {
    if (isCondition) {
        return (
            bindingItems?.findIndex((i) => isConditionKeyEqual(i.key, key)) ??
            -1
        );
    } else {
        return bindingItems?.findIndex((i) => i.key === key) ?? -1;
    }
}

function findBindings(
    items: BindingItem[],
    keys: string[]
): {
    bindingItems: BindingItem[] | undefined;
    isCondition: boolean;
} {
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

function convertOverride(key: string, o: OverrideBindingItem): BindingItem {
    if (o.name !== undefined && o.type !== undefined) {
        return {
            key: key,
            name: o.name,
            icon: o.icon,
            display: o.display,
            type: o.type,
            command: o.command,
            commands: o.commands,
            args: o.args,
            bindings: o.bindings,
        };
    } else {
        throw new Error("name or type of the override is undefined");
    }
}

function overrideBindingItems(
    items: BindingItem[],
    overrides: OverrideBindingItem[]
): void {
    for (const o of overrides) {
        try {
            const keys =
                typeof o.keys === "string" ? o.keys.split(".") : o.keys;
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

function sortBindingsItems(
    items: BindingItem[] | undefined,
    comparer: ((a: BindingItem, b: BindingItem) => number) | undefined
): void {
    if (!items || !comparer) {
        return;
    }

    items.sort(comparer);
    for (const item of items) {
        sortBindingsItems(item.bindings, comparer);
    }
}

function convertToTransientBinding(item: BindingItem): TransientBindingItem[] {
    const transientBindings: TransientBindingItem[] = [];
    if (item.bindings) {
        for (const b of item.bindings) {
            if (
                b.type === ActionType.Command ||
                b.type === ActionType.Commands
            ) {
                transientBindings.push({
                    key: b.key,
                    name: b.name,
                    icon: b.icon,
                    display: b.display,
                    ...toCommands(b),
                });
            } else if (b.type === ActionType.Bindings) {
                transientBindings.push({
                    key: b.key,
                    name: b.name,
                    icon: b.icon,
                    display: b.display,
                    command: Commands.Show,
                    args: b.bindings,
                    exit: true,
                });
            } else if (b.type === ActionType.Transient) {
                transientBindings.push({
                    key: b.key,
                    name: b.name,
                    icon: b.icon,
                    display: b.display,
                    command: Commands.ShowTransient,
                    args: {
                        title: item.name,
                        bindings: convertToTransientBinding(item),
                    },
                    exit: true,
                });
            } else {
                console.error(
                    `Type ${b.type} is not supported in convertToTransientBinding`
                );
            }
        }
    }
    return transientBindings;
}

function migrateTransient(item: BindingItem): BindingItem {
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
            icon: item.icon,
            display: item.display,
            type: ActionType.Commands,
            commands,
            args,
        };
    }
    return item;
}

function migrateBindings(items: BindingItem[]): BindingItem[] {
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

function getCanonicalConfig(c: WhichKeyConfig): BindingItem[] {
    const bindings = getConfig<BindingItem[]>(c.bindings) ?? [];
    if (c.overrides) {
        const overrides = getConfig<OverrideBindingItem[]>(c.overrides) ?? [];
        overrideBindingItems(bindings, overrides);
    }

    const sortOrder = getConfig<SortOrder>(Configs.SortOrder) ?? SortOrder.None;
    const sortComparer = getSortComparer(sortOrder);
    sortBindingsItems(bindings, sortComparer);

    return migrateBindings(bindings);
}
export default class WhichKeyCommand {
    private statusBar: StatusBar;
    private cmdRelay: CommandRelay;
    private repeater: WhichKeyRepeater;
    private bindingItems?: BindingItem[];
    private config?: WhichKeyConfig;
    private onConfigChangeListener?: Disposable;
    constructor(statusBar: StatusBar, cmdRelay: CommandRelay) {
        this.statusBar = statusBar;
        this.cmdRelay = cmdRelay;
        this.repeater = new WhichKeyRepeater(statusBar, cmdRelay);
    }

    register(config: WhichKeyConfig): void {
        this.unregister();
        this.config = config;

        this.bindingItems = getCanonicalConfig(config);
        this.onConfigChangeListener = workspace.onDidChangeConfiguration(
            (e) => {
                if (
                    e.affectsConfiguration(Configs.SortOrder) ||
                    e.affectsConfiguration(config.bindings) ||
                    (config.overrides &&
                        e.affectsConfiguration(config.overrides))
                ) {
                    this.register(config);
                }
            },
            this
        );
    }

    unregister(): void {
        this.onConfigChangeListener?.dispose();
        this.repeater.clear();
    }

    show(): void {
        const delay = getConfig<number>(Configs.Delay) ?? 0;
        const showIcons = getConfig<boolean>(Configs.ShowIcons) ?? true;
        const showButtons = getConfig<boolean>(Configs.ShowButtons) ?? true;
        const useFullWidthCharacters =
            getConfig<boolean>(Configs.UseFullWidthCharacters) ?? false;
        const config = {
            bindings: this.bindingItems!,
            delay,
            showIcons,
            showButtons,
            useFullWidthCharacters,
            title: this.config?.title,
        };
        showWhichKeyMenu(this.statusBar, this.cmdRelay, this.repeater, config);
    }

    showPreviousActions(): Promise<void> {
        return this.repeater.show();
    }

    repeatLastAction(): Promise<void> {
        return this.repeater.repeatLastAction();
    }

    static show(
        bindings: BindingItem[],
        statusBar: StatusBar,
        cmdRelay: CommandRelay
    ): void {
        const delay = getConfig<number>(Configs.Delay) ?? 0;
        const showIcons = getConfig<boolean>(Configs.ShowIcons) ?? true;
        const showButtons = getConfig<boolean>(Configs.ShowButtons) ?? true;
        const useFullWidthCharacters =
            getConfig<boolean>(Configs.UseFullWidthCharacters) ?? false;
        const config = {
            bindings,
            delay,
            showIcons,
            showButtons,
            useFullWidthCharacters,
        };
        showWhichKeyMenu(statusBar, cmdRelay, undefined, config);
    }
}
