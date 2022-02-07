import {
    Disposable,
    Event,
    EventEmitter,
    QuickInputButton,
    QuickPick,
    QuickPickItem,
    version,
    window,
} from "vscode";
import { CommandRelay, KeybindingArgs } from "../commandRelay";
import { DispatchQueue } from "../dispatchQueue";
import { ComparisonResult, Version } from "../version";

export interface BaseWhichKeyMenuItem {
    key: string;
}

export interface BaseWhichKeyQuickPickItem<T extends BaseWhichKeyMenuItem>
    extends QuickPickItem {
    item: T;
}

export interface BaseWhichKeyMenuState<T extends BaseWhichKeyMenuItem> {
    title?: string;
    items: T[];
    delay: number;
    showMenu: boolean;
    buttons?: QuickInputButton[];
}

export type OptionalBaseWhichKeyMenuState<T extends BaseWhichKeyMenuItem> =
    | BaseWhichKeyMenuState<T>
    | undefined;

export abstract class BaseWhichKeyMenu<T extends BaseWhichKeyMenuItem>
    implements Disposable
{
    private _acceptQueue: DispatchQueue<T>;
    private _valueQueue: DispatchQueue<string>;

    private _qp: QuickPick<BaseWhichKeyQuickPickItem<T>>;
    private _when?: string;
    private _lastValue: string;
    private _expectHiding: boolean;
    private _state: BaseWhichKeyMenuState<T>;
    private _timeoutId?: NodeJS.Timeout;
    private _disposables: Disposable[];

    private _onDidShowEmitter: EventEmitter<void>;
    private _onDidHideEmitter: EventEmitter<void>;
    private _onDisposeEmitter: EventEmitter<void>;

    onDidResolve?: () => any;
    onDidReject?: (reason?: any) => any;

    showButtons = true;

    constructor(cmdRelay: CommandRelay) {
        this._acceptQueue = new DispatchQueue(
            this.handleAcceptanceDispatch.bind(this)
        );
        this._valueQueue = new DispatchQueue(
            this.handleValueDispatch.bind(this)
        );
        this._lastValue = "";
        this._expectHiding = false;

        // Setup initial state
        this._state = {
            delay: 0,
            items: [],
            showMenu: false,
        };

        this._qp = window.createQuickPick<BaseWhichKeyQuickPickItem<T>>();
        this._onDidShowEmitter = new EventEmitter<void>();
        this._onDidHideEmitter = new EventEmitter<void>();
        this._onDisposeEmitter = new EventEmitter<void>();

        // setup on change value
        this._disposables = [
            this._onDidShowEmitter,
            this._onDidHideEmitter,
            this._onDisposeEmitter,
            cmdRelay.onDidKeyPressed(this.handleDidKeyPressed, this),
            this._qp.onDidAccept(this.handleDidAccept, this),
            this._qp.onDidChangeValue(this.handleDidChangeValue, this),
            this._qp.onDidHide(this.handleDidHide, this),
            this._qp,
        ];
    }

    /**
     * If this is true, setting `this.value` should call `this.handleDidChangeValue` to maintain backward compatibility.
     *
     * vscode 1.57+ changed API so setting QuickPick will trigger onDidChangeValue.
     * See https://github.com/microsoft/vscode/issues/122939.
     *
     */
    private static shouldTriggerDidChangeValueOnSet =
        Version.parse(version).compare(new Version(1, 57, 0)) ==
        ComparisonResult.Older;

    /**
     * Set the value of the QuicPick that's backward compatible.
     *
     * Note: This will call `this.handleDidChangeValue` either via
     * QuickPick's `onDidChangeValue` or manual call for backward compatibility.
     */
    set value(val: string) {
        this._qp.value = val;
        if (BaseWhichKeyMenu.shouldTriggerDidChangeValueOnSet) {
            // Trigger handler manually to maintain backward compatibility.
            this.handleDidChangeValue(val);
        }
    }

    get value() {
        return this._qp.value;
    }

    get when() {
        return this._when;
    }

    get state() {
        return this._state;
    }

    get onDidShow(): Event<void> {
        return this._onDidShowEmitter.event;
    }

    get onDidHide(): Event<void> {
        return this._onDidHideEmitter.event;
    }

    get onDidTriggerButton(): Event<QuickInputButton> {
        return this._qp.onDidTriggerButton;
    }

    get onDispose(): Event<void> {
        return this._onDisposeEmitter.event;
    }

    private handleDidKeyPressed(arg: KeybindingArgs): void {
        // Enqueue directly instead of setting value like
        // `this.key = this._qp.value + arg.key`
        // because QuickPick might lump key together
        // and send only one combined event especially when
        // the keys are set programmatically.
        //
        // For example:
        // ```
        // menu.show();
        // cmdRelay.triggerKey('m');
        // cmdRelay.triggerKey('x');
        // ```
        // or trigger via vscode vim re-mapper
        // ```
        // {
        //     "before": [","],
        //     "commands": [
        //         "whichkey.show",
        //         {"command": "whichkey.triggerKey", "args": "m"},
        //         {"command": "whichkey.triggerKey", "args": "x"}
        //     ],
        // }
        // ```
        this._when = arg.when;
        this._valueQueue.push(arg.key);
    }

    private handleDidAccept(): void {
        if (this._qp.activeItems.length > 0) {
            const qpItem = this._qp.activeItems[0];
            this._acceptQueue.push(qpItem.item);
        }
    }

    private handleDidChangeValue(value: string): void {
        const last = this._lastValue;

        // Not handling the unchanged value
        if (value === last) {
            return;
        }

        // Prevent character deletion
        if (value.length > 0 && value.length < last.length) {
            // This set will triggered another onDidChangeValue
            this.value = last;
            return;
        }

        // Set _lastValue before correct the value for the queue
        this._lastValue = value;

        // Correct input value while it's processing in the queue
        // before pushing to queue.
        //
        // For example, an extra key is pressing while waiting on hiding when handling.
        // [last] Example input value -> Corrected value
        // [""] "a" -> "a"
        // ["a"] "ab" -> "b"
        // ["ab"] "abC-c" -> "C-c"
        if (value.startsWith(last)) {
            value = value.substr(last.length);
        }

        // QuickPick's onDidChangeValue wouldn't wait on async function,
        // so push input to a queue to handle all changes sequentially to
        // prevent race condition on key change when one input is still
        // processing (mostly when waiting on hiding).
        this._valueQueue.push(value);
    }

    private handleDidHide(): void {
        // Fire event _onDidHideEmitter before dispose
        // So hide event will be sent before dispose.
        this._onDidHideEmitter.fire();

        if (!this._expectHiding) {
            this.dispose();
        }
        this._expectHiding = false;
    }

    private clearDelay(): void {
        // Clear timeout can take undefined
        clearTimeout(this._timeoutId!);
        this._timeoutId = undefined;
    }

    private async handleValueDispatch(key: string): Promise<void> {
        if (key.length > 0) {
            const item = this._state.items.find((i) => i.key === key);
            if (item) {
                await this.handleAcceptanceDispatch(item);
            } else {
                await this.handleMismatchDispatch(key);
            }
        }
    }

    private handleAcceptanceDispatch(item: T): Promise<void> {
        return this.handleDispatch(this.handleAccept(item));
    }

    private handleMismatchDispatch(key: string): Promise<void> {
        return this.handleDispatch(this.handleMismatch(key));
    }

    private async handleDispatch(
        nextState: Promise<OptionalBaseWhichKeyMenuState<T>>
    ): Promise<void> {
        try {
            const update = await nextState;
            if (update) {
                this.value = "";
                this.update(update);
                this.show();
            } else {
                this.resolve();
            }
        } catch (e) {
            this.reject(e);
        }
    }

    /**
     * Handles an accepted item from either input or UI selection.
     * @param item The item begin accepted.
     */
    protected abstract handleAccept(
        item: T
    ): Promise<OptionalBaseWhichKeyMenuState<T>>;

    /**
     * Handles when no item matches the input.
     * @param key the key that was entered.
     */
    protected abstract handleMismatch(
        key: string
    ): Promise<OptionalBaseWhichKeyMenuState<T>>;

    /**
     * Handles the rendering of an menu item.
     *
     * This is primarily used to control which, what, how menu items should
     * be shown in the forms of QuickPickItem.
     * @param items The menu items to render.
     */
    protected abstract handleRender(items: T[]): BaseWhichKeyQuickPickItem<T>[];

    /**
     * Updates the menu base on the state supplied.
     * @param state The state used to update the menu.
     */
    update(state: BaseWhichKeyMenuState<T>): void {
        this.clearDelay();
        this._qp.title = state.title;
        this._qp.buttons = this.showButtons ? state.buttons ?? [] : [];
        // Need clear the current rendered menu items
        // when user click the back button with delay
        // so we won't show the old menu items while the menu is
        // waiting to be displayed on delay.
        //
        // It worked without clearing for non-back button is because
        // the menu items has been filtered when the key was entered.
        // See https://github.com/microsoft/vscode/issues/137279
        this._qp.items = [];
        this._state = state;

        if (state.showMenu) {
            this._qp.busy = true;
            this._timeoutId = setTimeout(() => {
                this._qp.busy = false;
                this._qp.items = this.handleRender(state.items);
            }, state.delay);
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

    show(): void {
        this._qp.show();
        this._onDidShowEmitter.fire();
    }

    dispose(): void {
        this.clearDelay();
        this._valueQueue.clear();
        this._acceptQueue.clear();

        this._onDisposeEmitter.fire();
        for (const d of this._disposables) {
            d.dispose();
        }

        // Call onDidResolve once again in case dispose
        // was not called from resolve or reject.
        this.onDidResolve?.();
    }
}
