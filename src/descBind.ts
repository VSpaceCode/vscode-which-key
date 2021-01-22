import { ActionType, BindingItem } from "./bindingItem";
import { DescBindMenuItem } from "./menu/descBindMenu";
import { specializeBindingKey } from "./utils";

export function bindingsToMenuItems(items: readonly BindingItem[], path: BindingItem[] = []) {
    const curr: DescBindMenuItem[] = [];
    const next: DescBindMenuItem[] = [];

    for (const i of items) {
        const menuItem = conversion(i, path);
        curr.push(menuItem);
        if (menuItem.items) {
            next.push.apply(next, menuItem.items); // concat in-place
        }
    }

    curr.push.apply(curr, next); // concat in-place
    return curr;
}

function conversion(i: BindingItem, path: BindingItem[] = []) {
    const newPath = path.concat(i);

    const item: DescBindMenuItem = {
        label: pathToMenuLabel(newPath),
        detail: pathToMenuDetail(path),
        description: i.name,
    };
    if (i.bindings) {
        item.items = bindingsToMenuItems(i.bindings, newPath);
    } else if (i.commands) {
        item.commands = i.commands;
        item.args = i.args;
    } else if (i.command) {
        item.commands = [i.command];
        item.args = i.args ? [i.args] : undefined;
    }
    return item;
}

function pathToMenuLabel(path: BindingItem[]) {
    const keys = [];
    for (let i = 0; i < path.length; i++) {
        const item = path[i];
        keys.push(specializeBindingKey(item.key));
        if (item.type === ActionType.Conditional) {
            // Shift one extra key after conditional type
            // because we don't want to display something like
            // languageId:markdown as key
            i++;
        }
    }

    return keys.join(" ");
}

function pathToMenuDetail(path: BindingItem[]) {
    return path.map(p => p.name).join("$(chevron-right)");
}