import { commands, Disposable, QuickPick, window } from "vscode";
import { ActionType } from "../BindingItem";
import { ContextKey } from "../constants";
import KeyListener from "../keyListener";
import MenuItem from "./menuItem";

export class WhichKeyMenu {
    private keyListener: KeyListener;
    private items: MenuItem[];
    private title?: string;
    private isTransient: boolean;
    private quickPick: QuickPick<MenuItem>;
    private disposable: Disposable[];
    private promise: Promise<void>;
    private resolve: (value?: void | PromiseLike<void>) => void;
    private reject: (reason?: any) => void;
    private isHiding: boolean;

    constructor(keyListener: KeyListener, items: MenuItem[], isTransient: boolean, title?: string) {
        this.keyListener = keyListener;
        this.items = items;
        this.isTransient = isTransient;
        this.title = title;
        this.quickPick = window.createQuickPick<MenuItem>();
        this.resolve = this.reject = () => { }; // Needed for ts warning
        this.promise = new Promise<void>((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
        this.disposable = [
            this.keyListener.onDidKeyPressed(this.onDidKeyPressed.bind(this)),
            this.quickPick.onDidChangeValue(this.onDidChangeValue.bind(this)),
            this.quickPick.onDidAccept(this.onDidAccept.bind(this)),
            this.quickPick.onDidHide(this.onDidHide.bind(this))
        ];
        this.isHiding = false;
    }

    private onDidKeyPressed(value: string) {
        this.quickPick.value += value;
        this.onDidChangeValue(this.quickPick.value);
    }

    private async onDidChangeValue(value: string) {
        const chosenItem = this.quickPick.items.find(i => i.key === value);
        const hasSeq = this.quickPick.items.find(i => value.startsWith(i.key));
        if (hasSeq) {
            if (chosenItem) {
                await this.select(chosenItem);
            }
        } else {
            await this.hide();
            this.dispose();
            this.resolve();
        }
    }

    private onDidAccept() {
        if (this.quickPick.activeItems.length > 0) {
            const chosenItems = this.quickPick.activeItems[0] as MenuItem;
            this.select(chosenItems);
        }
    }

    private async onDidHide() {
        if (!this.isHiding) {
            // handle when it's not manually hiding
            await setContext(ContextKey.Active, false);
            this.dispose();
            this.resolve();
        }
    }

    private hide() {
        return new Promise(r => {
            this.isHiding = true;
            const disposable = this.quickPick.onDidHide(async () => {
                await setContext(ContextKey.Active, false);
                this.isHiding = false;
                disposable.dispose();
                r();
            });
            this.quickPick.hide();
        });
    }

    private async select(item: MenuItem) {
        try {
            await ((this.isTransient)
                ? this.selectActionTransient(item)
                : this.selectAction(item));
        } catch (e) {
            this.reject(e);
        }
    }

    private async selectAction(item: MenuItem) {
        if (item.type === ActionType.Command && item.command) {
            await this.hide();
            await executeCommand(item.command, item.args);
            this.dispose();
            this.resolve();
        } else if (item.type === ActionType.Commands && item.commands) {
            await this.hide();
            await executeCommands(item.commands, item.args);
            this.dispose();
            this.resolve();
        } else if (item.type === ActionType.Bindings && item.items) {
            await this.update(item.items, false, item.name);
        } else if (item.type === ActionType.Transient && item.items) {
            await this.hide();
            // optionally execute command/s before transient
            if (item.commands) {
                await executeCommands(item.commands, item.args);
            } else if (item.command) {
                await executeCommand(item.command, item.args);
            }
            await this.update(item.items, true, item.name);
        } else {
            throw new Error();
        }
    }

    private async selectActionTransient(item: MenuItem) {
        await this.hide();

        if (item.type === ActionType.Command && item.command) {
            await executeCommand(item.command, item.args);
        } else if (item.type === ActionType.Commands && item.commands) {
            await executeCommands(item.commands, item.args);
        } else if (item.type === ActionType.Bindings && item.items) {
            await this.update(item.items, false, item.name);
        } else if (item.type === ActionType.Transient && item.items) {
            // optionally execute command/s before transient
            if (item.commands) {
                await executeCommands(item.commands, item.args);
            } else if (item.command) {
                await executeCommand(item.command, item.args);
            }
            await this.update(item.items, true, item.name);
        } else {
            throw new Error();
        }

        await this.show();
    }

    private async update(items: MenuItem[], isTransient: boolean, title?: string) {
        this.items = items;
        this.isTransient = isTransient;
        this.title = title;

        await this.show();
    }

    private async show() {
        // change whichkeyVisible to whichkeyActive
        await setContext(ContextKey.Active, true);
        this.quickPick.items = this.items;
        this.quickPick.title = this.title;
        this.quickPick.value = '';
        this.quickPick.show();
    }

    private dispose() {
        for (const d of this.disposable) {
            d.dispose();
        }

        this.quickPick.dispose();
    }

    static show(keyListener: KeyListener, items: MenuItem[], isTransient: boolean, title?: string) {
        const menu = new WhichKeyMenu(keyListener, items, isTransient, title);
        menu.show();
        return menu.promise;
    }
}

export function setContext(key: string, value: any) {
    return commands.executeCommand("setContext", key, value);
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