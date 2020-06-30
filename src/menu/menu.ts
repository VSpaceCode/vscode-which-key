import { window, commands } from "vscode";
import { MenuItem } from "./menuItem";
import KeyListener from "../keyListener";

export function createQuickPick(keyListener: KeyListener, items: MenuItem[], title?: string) {
    return new Promise((resolve, reject) => {
        const quickPick = window.createQuickPick<MenuItem>();
        quickPick.title = title;
        quickPick.items = items;

        let resolveAfterAction = false;
        async function handleValueChanged(value: string) {
            const chosenItems = quickPick.items.find(i => i.key === value);
            if (chosenItems) {
                resolveAfterAction = true;
                await hide();
                try {
                    await chosenItems.action(keyListener);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            }
        }

        // Select with single key stroke
        const keyWatcherDisposable = keyListener.onDidKeyPressed((s) => {
            quickPick.value += s;
            handleValueChanged(quickPick.value);
        });
        const eventListenerDisposable = quickPick.onDidChangeValue(handleValueChanged);

        // Select with arrows + enter
        const acceptListenerDisposable = quickPick.onDidAccept(async () => {
            if (quickPick.activeItems.length > 0) {
                const chosenItems = quickPick.activeItems[0] as MenuItem;
                resolveAfterAction = true;
                await hide();
                try {
                    await chosenItems.action(keyListener);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            }
        });

        let isHiding = false;
        async function handleHidden() {
            keyWatcherDisposable.dispose();
            eventListenerDisposable.dispose();
            acceptListenerDisposable.dispose();
            didHideDisposable.dispose();
            quickPick.dispose();
            await commands.executeCommand("setContext", "whichkeyVisible", false);
            if (!resolveAfterAction) {
                resolve();
            }
        }
        function hide() {
            return new Promise(resolve => {
                const didHideDisposable = quickPick.onDidHide(async () => {
                    didHideDisposable.dispose();
                    await handleHidden();
                    resolve();
                });
                isHiding = true;
                quickPick.hide();
            });

        }
        const didHideDisposable = quickPick.onDidHide(() => {
            if (!isHiding) {
                handleHidden();
            }
        });

        quickPick.show();
        commands.executeCommand("setContext", "whichkeyVisible", true);
    });
}

export function createTransientQuickPick(keyWatcher: KeyListener, items: MenuItem[], title?: string) {
    return new Promise((resolve, reject) => {
        const quickPick = window.createQuickPick<MenuItem>();
        quickPick.title = title;
        quickPick.items = items;

        let disposeOnHidden = false;
        // Select with single key stroke
        const eventListenerDisposable = quickPick.onDidChangeValue(async () => {
            const chosenItems = quickPick.items.find(i => i.key === quickPick.value);
            if (chosenItems) {
                disposeOnHidden = false;
                quickPick.hide();
                try {
                    await chosenItems.action(keyWatcher);
                    disposeOnHidden = true;
                    reshowQuickPick();
                } catch (error) {
                    dispose(false);
                    reject(error);
                }
            } else {
                disposeOnHidden = true;
                quickPick.hide();
            }
        });

        // Select with arrows + enter
        const acceptListenerDisposable = quickPick.onDidAccept(async () => {
            if (quickPick.activeItems.length > 0) {
                const chosenItems = quickPick.activeItems[0] as MenuItem;
                disposeOnHidden = false;
                quickPick.hide();
                try {
                    await chosenItems.action(keyWatcher);
                    disposeOnHidden = true;
                    reshowQuickPick();
                } catch (error) {
                    dispose(false);
                    reject(error);
                }
            }
        });

        const didHideDisposable = quickPick.onDidHide(() => {
            if (disposeOnHidden) {
                dispose(true);
            }
        });

        function reshowQuickPick() {
            quickPick.value = '';
            quickPick.items = quickPick.items;
            quickPick.show();
        }

        function dispose(shouldResolve: boolean) {
            quickPick.dispose();
            eventListenerDisposable.dispose();
            acceptListenerDisposable.dispose();
            didHideDisposable.dispose();
            if (shouldResolve) {
                resolve();
            }
        }

        quickPick.show();
    });
}