import { Disposable, StatusBarItem, ThemeColor, window } from "vscode";

type StatusBarColor = string | ThemeColor | undefined;

export interface IStatusBar extends Disposable {
    timeout: number;
    setMessage(text: string): void;
    setErrorMessage(text: string): void;
    show(): void;
    hide(): void;

}
export class StatusBar implements IStatusBar {
    static DEFAULT_TIMEOUT = 3000;

    private _timeout: number;
    private _item: StatusBarItem;
    private _timerId?: NodeJS.Timer;

    constructor() {
        this._item = window.createStatusBarItem();
        this._timeout = StatusBar.DEFAULT_TIMEOUT;
    }

    get timeout() {
        return this._timeout;
    }

    set timeout(ms: number) {
        this._timeout = ms;
    }

    private _setMessage(text: string, color: StatusBarColor) {
        this.clearTimeout();
        this._item.color = color;
        this._item.text = text;
        this.show();
    }

    private clearTimeout() {
        if (this._timerId) {
            clearTimeout(this._timerId);
            this._timerId = undefined;
        }
    }

    setMessage(text: string) {
        this._setMessage(text, undefined);
    }

    setErrorMessage(text: string) {
        this._setMessage(text, new ThemeColor('errorForeground'));
    }

    show() {
        this._item.show();
        this._timerId = setTimeout(this.hide.bind(this), this._timeout);
    }

    hide() {
        this.clearTimeout();
        this._item.hide();
    }

    dispose() {
        this.clearTimeout();
        this._item.dispose();
    }
}