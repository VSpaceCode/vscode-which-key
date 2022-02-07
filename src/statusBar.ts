import { Disposable, StatusBarItem, ThemeColor, window } from "vscode";

export class StatusBar implements Disposable {
    static DEFAULT_TIMEOUT = 3000;
    static ERROR_FG_COLOR = new ThemeColor("statusBarItem.errorForeground");
    static ERROR_BG_COLOR = new ThemeColor("statusBarItem.errorBackground");

    private _timeout: number;
    private _isError: boolean;
    private _item: StatusBarItem;
    private _timerId?: NodeJS.Timer;

    constructor() {
        this._isError = false;
        this._item = window.createStatusBarItem();
        this._timeout = StatusBar.DEFAULT_TIMEOUT;
    }

    /**
     * The timeout in milliseconds of the message display. Set it to non-positive number to display message until this instance is disposed.
     */
    get timeout(): number {
        return this._timeout;
    }

    /**
     * The timeout in milliseconds of the message display. Set it to non-positive number to display message until this instance is disposed.
     */
    set timeout(ms: number) {
        this._timeout = ms;
    }

    private _setMessage(
        text: string,
        isError: boolean,
        timeout?: number
    ): void {
        this.clearTimeout();
        const fgColor = isError ? StatusBar.ERROR_FG_COLOR : undefined;
        const bgColor = isError ? StatusBar.ERROR_BG_COLOR : undefined;
        this._item.color = fgColor;
        this._item.backgroundColor = bgColor;
        this._item.text = text;
        this._isError = isError;
        this.show(timeout);
    }

    private clearTimeout(): void {
        if (this._timerId) {
            clearTimeout(this._timerId);
            this._timerId = undefined;
        }
    }

    /**
     * Set and show plain message with a specified timeout for this message.
     * @param text The message to display on the status bar.
     * @param timeout An optional timeout in ms for this message only.
     */
    setPlainMessage(text: string, timeout?: number): void {
        this._setMessage(text, false, timeout);
    }

    /**
     * Set and show error message with a specified timeout for this message.
     * @param text The message to display on the status bar.
     * @param timeout An optional timeout in ms for this message only.
     */
    setErrorMessage(text: string, timeout?: number): void {
        this._setMessage(text, true, timeout);
    }

    /**
     * Show the message.
     * @param timeout An optional timeout override for this show call.
     */
    show(timeout?: number): void {
        const ms = timeout ?? this._timeout;
        this._item.show();
        if (ms > 0) {
            this._timerId = setTimeout(this.hide.bind(this), ms);
        }
    }

    /**
     * Hide all types of message.
     */
    hide(): void {
        this.clearTimeout();
        this._item.hide();
    }

    /**
     * Hide only the plain message.
     */
    hidePlain(): void {
        if (!this._isError) {
            this.hide();
        }
    }

    /**
     * Hide only the error message.
     */
    hideError(): void {
        if (this._isError) {
            this.hide();
        }
    }

    dispose(): void {
        this.clearTimeout();
        this._item.dispose();
    }
}
