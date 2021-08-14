import { getSortComparer } from "./bindingComparer";
import { ActionType, BindingItem, BindingMap, LayerMap, OverrideBindingItem, toCommands, TransientBindingItem } from "./config/bindingItem";
import { isConditionKeyEqual } from "./config/condition";
import { WhichKeyConfig, WhichKeyLayerConfig } from "./config/whichKeyConfig";
import { Commands, Configs, SortOrder } from "./constants";
import { getConfig, notNullish } from "./utils";

function indexOfKey(bindingItems: BindingItem[] | undefined, key: string, isCondition = false): number {
    if (isCondition) {
        return bindingItems?.findIndex(i => isConditionKeyEqual(i.key, key)) ?? -1;
    } else {
        return bindingItems?.findIndex(i => i.key === key) ?? -1;
    }
}

function findBindings(items: BindingItem[], keys: string[]): {
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


function overrideBindingItems(items: BindingItem[], overrides: OverrideBindingItem[]): void {
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

/**
* Sort bindings items in place.
* @param items the binding items to be sorted in place.
* @param comparer a comparer function for sorting
*/
function sortBindingsItems(items: BindingItem[] | undefined, comparer: (a: BindingItem, b: BindingItem) => number): void {
    if (!items) {
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
            if (b.type === ActionType.Command
                || b.type === ActionType.Commands) {
                transientBindings.push({
                    key: b.key,
                    name: b.name,
                    icon: b.icon,
                    ...toCommands(b)
                });
            } else if (b.type === ActionType.Bindings) {
                transientBindings.push({
                    key: b.key,
                    name: b.name,
                    icon: b.icon,
                    command: Commands.Show,
                    args: b.bindings,
                    exit: true,
                });
            } else if (b.type === ActionType.Transient) {
                transientBindings.push({
                    key: b.key,
                    name: b.name,
                    icon: b.icon,
                    command: Commands.ShowTransient,
                    args: {
                        title: item.name,
                        bindings: convertToTransientBinding(item),
                    },
                    exit: true,
                });
            } else {
                console.error(`Type ${b.type} is not supported in convertToTransientBinding`);
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

function convertOverride(key: string, o: OverrideBindingItem): BindingItem {
    if (o.name !== undefined && o.type !== undefined) {
        return {
            key: key,
            name: o.name,
            icon: o.icon,
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

function convertBindingMap(bm: BindingMap): BindingItem[] {
    return Object.entries(bm).map(([key, b]) => (notNullish(b)
        ? <BindingItem>{
            key: key,
            type: b.type,
            name: b.name,
            icon: b.icon,
            command: b.command,
            commands: b.commands,
            args: b.args,
            bindings: b.bindings ? convertBindingMap(b.bindings) : undefined
        }
        : undefined)
    ).filter(notNullish);
}

function merge(object: any, ...sources: any[]) {
    for (const src of sources) {
        if (notNullish(src)) {
            Object.entries(src).reduce((o, [k, v]) => {
                if (v) { // Filter out all the undefined / null value property
                    o[k] = typeof v === 'object'
                        ? merge(o[k] = o[k] || (Array.isArray(v) ? [] : {}), v)
                        : v;
                }
                return o;
            }, object);
        }
    }

    return object;
}

function convertLayers(layerMap: LayerMap): BindingItem[] {
    const bindingMap = merge({}, ...Object.values(layerMap).map(l => l?.bindings)) as BindingMap;
    return convertBindingMap(bindingMap);
}


function finalizeBindings(bindings: BindingItem[]): BindingItem[] {
    const sortOrder = getConfig<SortOrder>(Configs.SortOrder) ?? SortOrder.None;
    const comparer = getSortComparer(sortOrder);

    if (comparer) {
        sortBindingsItems(bindings, comparer);
    }

    return migrateBindings(bindings);
}

export function getCanonicalBindingsFromConfig(c: WhichKeyConfig): BindingItem[] {
    const bindings = getConfig<BindingItem[]>(c.bindings) ?? [];
    if (c.overrides) {
        const overrides = getConfig<OverrideBindingItem[]>(c.overrides) ?? [];
        overrideBindingItems(bindings, overrides);
    }

    return finalizeBindings(bindings);
}

export function getCanonicalBindingsFromLayerConfig(c: WhichKeyLayerConfig): BindingItem[] {
    const layers = getConfig<LayerMap>(c.layers) ?? {};
    const bindings = convertLayers(layers) ?? [];
    if (c.overrides) {
        const overrides = getConfig<OverrideBindingItem[]>(c.overrides) ?? [];
        overrideBindingItems(bindings, overrides);
    }

    return finalizeBindings(bindings);
}

// export function for unit tests
export const _ = {
    merge,
    overrideBindingItems,
    sortBindingsItems,
    convertToTransientBinding,
    migrateBindings,
    convertLayers
};
