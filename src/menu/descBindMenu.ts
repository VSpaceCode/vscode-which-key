import { Disposable, QuickPick, window } from "vscode";
import { DispatchQueue } from "../dispatchQueue";
import { executeCommands } from "../utils";
import { DescBindMenuItem } from "./descBindMenuItem";

class DescBindMenu implements Disposable {
    private _disposables: Disposable[];
    private _qp: QuickPick<DescBindMenuItem>;
    private _expectHiding: boolean;
    private _acceptQueue: DispatchQueue<DescBindMenuItem>;

    onDidResolve?: () => any;
    onDidReject?: (reason?: any) => any;

    constructor(quickPick: QuickPick<DescBindMenuItem>) {
        this._acceptQueue = new DispatchQueue(this.accept.bind(this));
        this._expectHiding = false;
        this._qp = quickPick;

        this._disposables = [
            this._qp.onDidAccept(this.handleDidAccept, this),
            this._qp.onDidHide(this.handleDidHide, this),
            this._qp,
        ];
    }

    private handleDidAccept() {
        if (this._qp.activeItems.length > 0) {
            const item = this._qp.activeItems[0];
            this._acceptQueue.push(item);
        }
    }

    private async accept(val: DescBindMenuItem) {
        try {
            this._qp.value = "";
            if (val.commands) {
                await this.hide();
                await executeCommands(val.commands, val.args);
            }

            if (val.items) {
                this._qp.placeholder = val.description;
                this._qp.items = val.items;
                this.show();
            } else {
                this.resolve();
            }
        } catch (e) {
            this.reject(e);
        }
    }

    private resolve(): void {
        this.onDidResolve?.();
        this.dispose();
    }

    private reject(e: any): void {
        this.onDidReject?.(e);
        this.dispose();
    }

    private handleDidHide() {
        if (!this._expectHiding) {
            this.dispose();
        }
        this._expectHiding = false;
    }

    hide(): Promise<void> {
        return new Promise<void>((r) => {
            this._expectHiding = true;
            // Needs to wait onDidHide because
            // https://github.com/microsoft/vscode/issues/135747
            const disposable = this._qp.onDidHide(() => {
                this._expectHiding = false;
                disposable.dispose();
                r();
            });
            this._qp.hide();
        });
    }

    show() {
        this._qp.show();
    }

    dispose(): void {
        this._acceptQueue.clear();
        for (const d of this._disposables) {
            d.dispose();
        }

        // Call onDidResolve once again in case dispose were not call from resolve and reject
        this.onDidResolve?.();
    }
}

export function showDescBindMenu(
    items: DescBindMenuItem[],
    title?: string
): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const qp = window.createQuickPick<DescBindMenuItem>();
        qp.matchOnDescription = true;
        qp.matchOnDetail = true;
        qp.items = items;
        qp.title = title;
        const menu = new DescBindMenu(qp);
        menu.onDidResolve = resolve;
        menu.onDidReject = reject;
        menu.show();
    });
}
