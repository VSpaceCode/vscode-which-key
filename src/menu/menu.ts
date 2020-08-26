import { commands, Disposable, QuickPick, window } from "vscode";
import { ContextKey } from "../constants";
import KeyListener, { KeybindingArgs } from "../keyListener";
import { setStatusBarMessage } from "../statusBar";
import { BaseMenuItem, convertToMenuLabel } from "./menuItem";

export class WhichKeyMenu {
    private keyListener: KeyListener;
    private items: BaseMenuItem[];
    private title?: string;
    private isTransient: boolean;

    private quickPick: QuickPick<BaseMenuItem>;
    private disposables: Disposable[];
    private isHiding: boolean;
    private itemHistory: BaseMenuItem[];

    // Promise related properties for the promise returned by show()
    private promise: Promise<void>;
    private resolve!: (value?: void | PromiseLike<void>) => void;
    private reject!: (reason?: any) => void;

    // Delay related properties
    private delay: number;
    private timeoutId?: NodeJS.Timeout;
    // This is the currently entered value in delay mode
    // so we can display the chain of keys that's been entered
    private enteredValue = '';
    // This used to stored the last when condition from the key listener
    private when?: string;

    constructor(keyListener: KeyListener, items: BaseMenuItem[], isTransient: boolean, delay: number, title?: string) {
        this.keyListener = keyListener;
        this.items = items;
        this.isTransient = isTransient;
        this.delay = delay;
        this.title = title;
        this.quickPick = window.createQuickPick<BaseMenuItem>();
        this.promise = new Promise<void>((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
        this.disposables = [
            this.keyListener.onDidKeyPressed(this.onDidKeyPressed.bind(this)),
            this.quickPick.onDidChangeValue(this.onDidChangeValue.bind(this)),
            this.quickPick.onDidAccept(this.onDidAccept.bind(this)),
            this.quickPick.onDidHide(this.onDidHide.bind(this))
        ];
        this.isHiding = false;
        this.itemHistory = [];
    }

    private get condition() {
        const languageId = window.activeTextEditor?.document.languageId;
        return {
            when: this.when,
            languageId
        };
    }

    private onDidKeyPressed(value: KeybindingArgs) {
        this.quickPick.value += value.key;
        this.onDidChangeValue(this.quickPick.value, value.when);
    }

    private async onDidChangeValue(value: string, when?: string) {
        this.when = when;
        if (this.timeoutId) {
            // When the menu is in the delay display mode
            if (value.startsWith(this.enteredValue)) {
                value = value.substring(this.enteredValue.length);
            } else {
                // Disallow user from removing entered value when in delay
                this.quickPick.value = this.enteredValue;
                return;
            }
        }

        const chosenItem = this.items.find(i => i.key === value);
        const hasSeq = this.items.find(i => value.startsWith(i.key));
        if (hasSeq) {
            if (chosenItem) {
                await this.select(chosenItem);
            }
        } else {
            await this.hide();
            const keyCombo = this.getHistoryString(value);
            setStatusBarMessage(`${keyCombo} is undefined`, 5000, true);
            this.dispose();
            this.resolve();
        }
    }

    private getHistoryString(currentKey?: string) {
        let keyCombo = this.itemHistory.map(i => i.key);
        if (currentKey) {
            keyCombo = keyCombo.concat(currentKey);
        }
        return keyCombo.map(convertToMenuLabel).join(' ');
    }

    private onDidAccept() {
        if (this.quickPick.activeItems.length > 0) {
            const chosenItems = this.quickPick.activeItems[0] as BaseMenuItem;
            this.select(chosenItems);
        }
    }

    private async onDidHide() {
        this.clearDelay();
        await setContext(ContextKey.Visible, false);
        if (!this.isHiding) {
            // Dispose correctly when it is not manually hiding
            this.dispose();
            this.resolve();
        }
    }

    // Manually hide the menu
    private hide() {
        return new Promise<void>(r => {
            this.isHiding = true;
            const disposable = this.quickPick.onDidHide(() => {
                this.isHiding = false;
                disposable.dispose();
                r();
            });
            this.quickPick.hide();
        });
    }

    private async select(item: BaseMenuItem) {
        try {
            await ((this.isTransient)
                ? this.selectActionTransient(item)
                : this.selectAction(item));
        } catch (e) {
            this.dispose();
            this.reject(e);
        }
    }

    private async selectAction(item: BaseMenuItem) {
        const result = item.select(this.condition);
        if (result.commands) {
            await this.hide();
            await executeCommands(result.commands, result.args);
        }

        if (result.items) {
            this.updateState(result.items, !!result.isTransient, item.name);
            this.itemHistory.push(item);
            await this.show();
        } else {
            this.dispose();
            this.resolve();
        }
    }

    private async selectActionTransient(item: BaseMenuItem) {
        await this.hide();

        const result = item.select(this.condition);
        if (result.commands) {
            await executeCommands(result.commands, result.args);
        }

        if (result.items) {
            this.updateState(result.items, !!result.isTransient, item.name);
            this.itemHistory.push(item);
        }

        await this.show();
    }


    private updateState(items: BaseMenuItem[], isTransient: boolean, title?: string) {
        this.items = items;
        this.isTransient = isTransient;
        this.title = title;
    }

    private clearDelay() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = undefined;
        }
    }

    private async show() {
        const updateQuickPick = () => {
            this.quickPick.busy = false;
            this.enteredValue = '';
            this.quickPick.value = '';
            this.quickPick.title = this.title;
            this.quickPick.items = this.items;
        };

        if (!this.isTransient && this.delay > 0) {
            this.clearDelay(); // clear old delay
            this.enteredValue = this.quickPick.value;
            this.quickPick.busy = true;
            this.quickPick.items = [];
            this.timeoutId = setTimeout(() => {
                this.clearDelay();
                updateQuickPick();
            }, this.delay);
        } else {
            updateQuickPick();
        }

        await setContext(ContextKey.Visible, true);
        this.quickPick.show();
    }

    private dispose() {
        for (const d of this.disposables) {
            d.dispose();
        }

        this.quickPick.dispose();
    }

    static async show(keyListener: KeyListener, items: BaseMenuItem[], isTransient: boolean, delay: number, title?: string) {
        try {
            const menu = new WhichKeyMenu(keyListener, items, isTransient, delay, title);
            await setContext(ContextKey.Active, true);
            await menu.show();
            return await menu.promise;
        } finally {
            await setContext(ContextKey.Active, false);
        }
    }
}

function setContext(key: string, value: any) {
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