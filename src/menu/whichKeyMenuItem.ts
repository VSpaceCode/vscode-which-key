import { commands } from "vscode";
import { ActionType, BindingItem, OverrideBindingItem } from "../BindingItem";
import { createQuickPick, createTransientQuickPick } from "./menu";
import { MenuItem } from "./menuItem";

export default class WhichKeyMenuItem implements MenuItem {
    name: string;
    key: string;
    type: ActionType;
    command?: string;
    commands?: string[];
    items?: WhichKeyMenuItem[];
    args?: any;

    constructor(item: BindingItem) {
        this.name = item.name;
        this.key = item.key;
        this.type = item.type;
        this.command = item.command;
        this.commands = item.commands;
        this.args = item.args;
        if (this.type === ActionType.Bindings) {
            this.items = WhichKeyMenuItem.createItems(item.bindings ?? []);
        } else if (this.type === ActionType.Transient) {
            this.items = WhichKeyMenuItem.createItems(item.bindings ?? []);
        }
    }

    get label() {
        return this.key === ' ' ? '␣' : this.key;
    }

    get description() {
        // Add tab so the description is aligned
        return `\t${this.name}`;
    }

    async action(): Promise<unknown> {
        if (this.type === ActionType.Command && this.command) {
            return await executeCommand(this.command, this.args);
        } else if (this.type === ActionType.Commands && this.commands) {
            return await executeCommands(this.commands, this.args);
        } else if (this.type === ActionType.Bindings && this.items) {
            return await createQuickPick(this.items, this.name);
        } else if (this.type === ActionType.Transient && this.items) {
            // optionally execute command/s before transient
            if (this.commands) {
                await executeCommands(this.commands, this.args);
            } else if (this.command) {
                await executeCommand(this.command, this.args);
            }
            return await createTransientQuickPick(this.items, this.name);
        }

        return Promise.reject();
    }

    static createItems(items: BindingItem[]) {
        return items.map(i => new WhichKeyMenuItem(i));
    }

    static overrideItems(
        items?: WhichKeyMenuItem[],
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
                        const newItem = createMenuItem(o, key);
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
                            const newItem = createMenuItem(o, key);
                            menuItems.splice(o.position, 0, newItem);
                        }
                    }
                }
            } catch (e) {
                console.error(e);
            }
        });
    }
}

function createMenuItem(o: OverrideBindingItem, key: string) {
    if (o.name !== undefined && o.type !== undefined) {
        return new WhichKeyMenuItem({
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
function executeCommand(cmd: string, args: any) {
    if (Array.isArray(args)) {
        const arr = args as any[];
        return commands.executeCommand(cmd, ...arr);
    } else if (args) {
        // undefined from the object chainning/indexing or
        // null from the json deserialization
        return commands.executeCommand(cmd, args);
    } else {
        return commands.executeCommand(cmd);
    }
}

async function executeCommands(cmds: string[], args: any) {
    for (let i = 0; i < cmds.length; i++) {
        const cmd = cmds[i];
        const arg = args?.[i];
        await executeCommand(cmd, arg);
    }
}