import { Disposable, StatusBarItem, ThemeColor, window } from "vscode";

type StatusBarColor = string | ThemeColor | undefined;

export interface IStatusBar extends Disposable {
    /**
     * The timeout in milliseconds of the message display. Set it to non-positive number to display message until this instance is disposed.
     */
    timeout: number;

    /**
     * Set and show plain message with a specified timeout for this message.
     * @param text The message to display on the status bar.
     * @param timeout An optional timeout in ms for this message only.
     */
    setPlainMessage(text: string, timeout?: number): void;

    /**
     * Set and show error message with a specified timeout for this message.
     * @param text The message to display on the status bar.
     * @param timeout An optional timeout in ms for this message only.
     */
    setErrorMessage(text: string, timeout?: number): void;

    /**
     * Show the message.
     * @param timeout An optional timeout override for this show call.
     */
    show(timeout?: number): void;

    /**
     * Hide all types of message.
     */
    hide(): void;

    /**
     * Hide only the plain message.
     */
    hidePlain(): void;
    
    /**
     * Hide only the error message.
     */
    hideError(): void;
}
export class StatusBar implements IStatusBar {
    static DEFAULT_TIMEOUT = 3000;
    static ERROR_COLOR = new ThemeColor('errorForeground');

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

    private _setMessage(text: string, color: StatusBarColor, timeout?: number) {
        this.clearTimeout();
        this._item.color = color;
        this._item.text = text;
        this.show(timeout);
    }

    private clearTimeout() {
        if (this._timerId) {
            clearTimeout(this._timerId);
            this._timerId = undefined;
        }
    }

    setPlainMessage(text: string, timeout?: number) {
        this._setMessage(text, undefined, timeout);
    }

    setErrorMessage(text: string, timeout?: number) {
        this._setMessage(text, StatusBar.ERROR_COLOR, timeout);
    }

    show(timeout?: number) {
        const ms = timeout ?? this._timeout;
        this._item.show();
        if (ms > 0) {
            this._timerId = setTimeout(this.hide.bind(this), ms);
        }
    }

    hide() {
        this.clearTimeout();
        this._item.hide();
    }

    hidePlain() {
        if (this._item.color !== StatusBar.ERROR_COLOR) {
            this.hide();
        }
    }

    hideError() {
        if (this._item.color === StatusBar.ERROR_COLOR) {
            this.hide();
        }
    }

    dispose() {
        this.clearTimeout();
        this._item.dispose();
    }
}