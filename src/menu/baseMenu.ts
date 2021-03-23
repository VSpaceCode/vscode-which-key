import { Disposable, QuickPick, QuickPickItem, version, window } from "vscode";
import { Version } from "../version";

export abstract class BaseMenu<T extends QuickPickItem> implements Disposable {
    private onDidChangeValueDisposable: Disposable;

    protected quickPick: QuickPick<T>;
    protected disposables: Disposable[];
    protected isHiding: boolean;

    public title: string | undefined = undefined;
    public placeholder: string | undefined = undefined;
    public matchOnDetail = false;
    public matchOnDescription = false;
    public value = "";
    public busy = false;
    public items: readonly T[] = [];

    onDidResolve?: () => any;
    onDidReject?: (reason?: any) => any;

    constructor() {
        this.quickPick = window.createQuickPick<T>();
        this.disposables = [
            this.quickPick.onDidAccept(this.onDidAccept, this),
            this.quickPick.onDidHide(this.onDidHide, this),
        ];
        this.onDidChangeValueDisposable = this.quickPick.onDidChangeValue(this.onDidChangeValue, this);
        this.isHiding = false;
    }

    /**
     * Set the value of the QuickPick without triggering the onDidChangeValue event.
     * @param value the string value to set the filter text of the QuickPick.
     */
    protected setValue(value: string): Promise<void> {
        return new Promise<void>((resolve) => {
            if (this.quickPick.value !== value) {
                const v = Version.parse(version);
                if (v.major >= 1 && v.minor >= 57) {
                    // vscode 1.57 or later changed the onDidChangeValue API
                    // https://github.com/microsoft/vscode/issues/122939
                    //
                    // The workaround is as follow:
                    // 1. Remove the existing listener
                    // 2. Set up temp listener
                    // 3. Update value
                    // 4. Wait until the temp listener is trigger
                    // 5. Restore the onDidChangeValue listener
                    this.onDidChangeValueDisposable.dispose();
                    const d = this.quickPick.onDidChangeValue(() => {
                        this.onDidChangeValueDisposable = this.quickPick.onDidChangeValue(this.onDidChangeValue, this);
                        d.dispose();
                        resolve();
                    });
                    this.quickPick.value = value;
                } else {
                    this.quickPick.value = value;
                    resolve();
                }
            } else {
                resolve();
            }
        });
    }

    private async onDidAccept(): Promise<void> {
        if (this.quickPick.activeItems.length > 0) {
            const item = this.quickPick.activeItems[0];
            await this.accept(item);
        }
    }

    protected async accept(item: T): Promise<void> {
        try {
            await this.setValue("");
            this.quickPick.placeholder = undefined;
            this.quickPick.title = undefined;
            this.quickPick.items = [];
            await this.handleAcceptance(item);
        } catch (e) {
            this.reject(e);
        }
    }

    protected abstract handleAcceptance(item: T): Thenable<unknown>;

    protected async onDidHide(): Promise<void> {
        if (!this.isHiding) {
            // Dispose correctly when it is not manually hiding
            this.resolve();
        }

        await this.onVisibilityChange(false);
    }

    protected onDidChangeValue(_: string): Thenable<unknown> {
        return Promise.resolve();
    }

    protected onVisibilityChange(_: boolean): Thenable<unknown> {
        return Promise.resolve();
    }

    protected resolve(): void {
        this.dispose();
        if (this.onDidResolve) {
            this.onDidResolve();
        }
    }

    protected reject(e: any): void {
        this.dispose();
        if (this.onDidReject) {
            this.onDidReject(e);
        }
    }

    protected async update(): Promise<void> {
        this.quickPick.title = this.title;
        this.quickPick.placeholder = this.placeholder;
        this.quickPick.matchOnDetail = this.matchOnDetail;
        this.quickPick.matchOnDescription = this.matchOnDescription;
        await this.setValue(this.value);
        this.quickPick.busy = this.busy;
        this.quickPick.items = this.items;
    }

    async show(): Promise<void> {
        await this.onVisibilityChange(true);
        await this.update();
        this.quickPick.show();
    }

    // Manually hide the menu
    hide(): Promise<void> {
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

    dispose(): void {
        for (const d of this.disposables) {
            d.dispose();
        }

        this.onDidChangeValueDisposable.dispose();
        this.quickPick.dispose();
    }
}