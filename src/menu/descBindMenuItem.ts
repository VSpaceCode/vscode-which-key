import { QuickPickItem } from "vscode";
import { BindingItem, toCommands } from "../config/bindingItem";
import { getCondition } from "../config/condition";
import { specializeBindingKey } from "../utils";

function pathToMenuLabel(path: BindingItem[]): string {
    return path
        // Filter all the condition key so we will not show something like
        // languageId:markdown
        .filter(item => !getCondition(item.key))
        .map(item => specializeBindingKey(item.key))
        .join(" ");
}

function pathToMenuDetail(path: BindingItem[]): string {
    return path.map(p => p.name).join("$(chevron-right)");
}

function conversion(i: BindingItem, path: BindingItem[] = []): DescBindMenuItem {
    const newPath = path.concat(i);

    const item: DescBindMenuItem = {
        label: pathToMenuLabel(newPath),
        detail: pathToMenuDetail(path),
        description: i.name,
    };
    if (i.bindings) {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        item.items = createDescBindItems(i.bindings, newPath);
    } else if (i.commands || i.command) {
        const { commands, args } = toCommands(i);
        item.commands = commands;
        item.args = args;
    }

    return item;
}
export interface DescBindMenuItem extends QuickPickItem {
    commands?: string[];
    args?: string[];
    items?: DescBindMenuItem[];
}

export function createDescBindItems(items: readonly BindingItem[], path: BindingItem[] = []): DescBindMenuItem[] {
    const curr: DescBindMenuItem[] = [];
    const next: DescBindMenuItem[] = [];

    for (const i of items) {
        path = path.filter(p => p.bindings);
        const menuItem = conversion(i, path);
        curr.push(menuItem);
        if (menuItem.items) {
            next.push(...menuItem.items); // concat in-place
        }
    }

    curr.push(...next); // concat in-place
    return curr;
}
