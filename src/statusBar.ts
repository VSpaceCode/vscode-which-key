import { Disposable, ThemeColor, window } from "vscode";

let lastMessage: Disposable | undefined;
/**
 * Set a message to the status bar. This is a short hand for the more powerful
 * status bar [items](#window.createStatusBarItem).
 *
 * @param text The message to show, supports icon substitution as in status bar [items](#StatusBarItem.text).
 * @param hideAfterTimeout Timeout in milliseconds after which the message will be disposed.
 * @param isError the message foreground will be ThemeColor of "errorForeground" if this is true.
 * @return A disposable which hides the status bar message.
 */
export function setStatusBarMessage(text: string, hideAfterTimeout: number, isError: boolean): Disposable {
    lastMessage?.dispose();

    const item = window.createStatusBarItem();
    item.color = isError ? new ThemeColor('errorForeground') : undefined;
    item.text = text;
    item.show();

    let timeoutId: NodeJS.Timeout;
    const disposable = new Disposable(() => {
        clearTimeout(timeoutId);
        item.dispose();
    });

    timeoutId = setTimeout(() => {
        disposable.dispose();
    }, hideAfterTimeout);

    lastMessage = disposable;
    return disposable;
}