import { commands, Disposable, QuickPick, window } from "vscode";
import { ContextKey, defaultStatusBarTimeout } from "../constants";
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
            this.keyListener.onDidKeyPressed(this.onDidKeyPressed, this),
            this.quickPick.onDidChangeValue(this.onDidChangeValue, this),
            this.quickPick.onDidAccept(this.onDidAccept, this),
            this.quickPick.onDidHide(this.onDidHide, this)
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
                // Normal case where user enters key while in delay
                value = value.substring(this.enteredValue.length);
            } else if (this.enteredValue.startsWith(value)) {
                // Disallow user from removing entered value when in delay 
                this.quickPick.value = this.enteredValue;
                return;
            } else {
                // special case for fixing the quick pick value if trigger key command
                // was called before the menu is displayed. When the menu is displayed,
                // quick pick value is then selected. Any subsequent key will remove
                // the value in the input.
                this.quickPick.value = this.enteredValue + value;
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
            setStatusBarMessage(`${keyCombo} is undefined`, defaultStatusBarTimeout, true);
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

    private async onDidAccept() {
        if (this.quickPick.activeItems.length > 0) {
            const chosenItems = this.quickPick.activeItems[0] as BaseMenuItem;
            await this.select(chosenItems);
        }
    }

    private async onDidHide() {
        this.clearDelay();
        if (!this.isHiding) {
            // Dispose correctly when it is not manually hiding
            this.dispose();
            this.resolve();
        }
        await setContext(ContextKey.Visible, false);
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

        const thenable = setContext(ContextKey.Visible, true);
        this.quickPick.show();
        await thenable;
    }

    private dispose() {
        for (const d of this.disposables) {
            d.dispose();
        }

        this.quickPick.dispose();
    }

    static show(keyListener: KeyListener, items: BaseMenuItem[], isTransient: boolean, delay: number, title?: string) {
        return new Promise(async (resolve) => {
            try {
                const menu = new WhichKeyMenu(keyListener, items, isTransient, delay, title);
                await Promise.all([
                    setContext(ContextKey.Active, true),
                    menu.show()
                ]);
                // Resolve the promise right after show to fix the issue where executing show command which can freeze vim instead of waiting on menu.
                // In addition, show command waits until we call menu show to allow chaining command of show and triggerKey.
                // Specifically, when triggerKey called before shown is done. The value will be set before shown, which causes the
                // value to be selected.
                resolve();
                await menu.promise;
            } catch (e) {
                window.showErrorMessage(e.toString());
            } finally {
                await Promise.all([
                    setContext(ContextKey.Active, false),
                    // We set visible to true before QuickPick is shown (because vscode doesn't provide onShown API)
                    // Visible can be stuck in true if the menu is disposed before it's shown (e.g.
                    // calling show without waiting and triggerKey command in sequence) 
                    // Therefore, we are cleaning up here to make sure it is not stuck.
                    setContext(ContextKey.Visible, false)
                ]);
            }
        });
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