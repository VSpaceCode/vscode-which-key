import { Disposable, QuickInputButton, ThemeIcon, window } from "vscode";
import { CommandRelay } from "../commandRelay";
import {
    ActionType,
    BindingItem,
    DisplayOption,
    toCommands,
} from "../config/bindingItem";
import { Condition, evalCondition, getCondition } from "../config/condition";
import { WhichKeyMenuConfig } from "../config/menuConfig";
import { ContextKey } from "../constants";
import { StatusBar } from "../statusBar";
import {
    executeCommands,
    setContext,
    toFullWidthKey,
    toFullWidthSpecializedKey,
    toSpecializedKey,
} from "../utils";
import { WhichKeyRepeater } from "../whichKeyRepeater";
import {
    BaseWhichKeyMenu,
    BaseWhichKeyMenuState,
    BaseWhichKeyQuickPickItem,
    OptionalBaseWhichKeyMenuState,
} from "./baseWhichKeyMenu";
import { showDescBindMenu } from "./descBindMenu";
import { createDescBindItems } from "./descBindMenuItem";

type OptionalWhichKeyMenuState = OptionalBaseWhichKeyMenuState<BindingItem>;

function evalBindingCondition(
    item?: BindingItem,
    condition?: Condition
): BindingItem | undefined {
    while (item && item.type === ActionType.Conditional) {
        // Search the condition first. If no matches, find the first empty condition as else
        item =
            findBindingWithCondition(item.bindings, condition) ??
            findBindingWithCondition(item.bindings, undefined);
    }
    return item;
}

function findBindingWithCondition(
    bindings?: BindingItem[],
    condition?: Condition
): BindingItem | undefined {
    return bindings?.find((i) => evalCondition(getCondition(i.key), condition));
}

class WhichKeyMenu extends BaseWhichKeyMenu<BindingItem> {
    private _stateHistory: BaseWhichKeyMenuState<BindingItem>[];
    private _itemHistory: BindingItem[];
    private __disposables: Disposable[];

    private _statusBar: StatusBar;
    private _repeater?: WhichKeyRepeater;

    useFullWidthCharacters = false;
    showIcons = true;
    delay = 0;

    constructor(
        statusBar: StatusBar,
        cmdRelay: CommandRelay,
        repeater?: WhichKeyRepeater
    ) {
        super(cmdRelay);
        this._statusBar = statusBar;
        this._repeater = repeater;

        this._stateHistory = [];
        this._itemHistory = [];
        this.__disposables = [
            cmdRelay.onDidSearchBindings(this.handleDidSearchBindings, this),
            cmdRelay.onDidUndoKey(this.handleDidUndoKey, this),
            this.onDidTriggerButton(this.handleDidTriggerButton, this),
            this.onDidHide(() => setContext(ContextKey.Visible, false)),
            this.onDidShow(() => setContext(ContextKey.Visible, true)),
        ];
    }

    static SearchBindingButton: QuickInputButton = {
        iconPath: new ThemeIcon("search"),
        tooltip: "Search keybindings",
    };

    static UndoKeyButton: QuickInputButton = {
        iconPath: new ThemeIcon("arrow-left"),
        tooltip: "Undo key",
    };

    private static NonRootMenuButtons = [
        this.UndoKeyButton,
        this.SearchBindingButton,
    ];

    private get condition(): Condition {
        const languageId = window.activeTextEditor?.document.languageId;
        return {
            when: this.when,
            languageId,
        };
    }

    private handleDidSearchBindings(): Promise<void> {
        const items = createDescBindItems(this.state.items, this._itemHistory);
        return showDescBindMenu(items, "Search Keybindings");
    }

    private handleDidUndoKey() {
        const length = this._stateHistory.length;
        if (length > 1) {
            // Splice the last two elements which are
            // -2: The state we are restoring
            // -1: The current state
            const [restore] = this._stateHistory.splice(length - 2);
            this._itemHistory.pop();
            this.value = "";
            this.update(restore);
            this.show();
        }
    }

    private handleDidTriggerButton(button: QuickInputButton) {
        switch (button) {
            case WhichKeyMenu.UndoKeyButton:
                this.handleDidUndoKey();
                break;
            case WhichKeyMenu.SearchBindingButton:
                this.handleDidSearchBindings();
                break;
        }
    }

    protected override async handleAccept(
        item: BindingItem
    ): Promise<OptionalWhichKeyMenuState> {
        this._itemHistory.push(item);
        this._statusBar.hide();

        const result = evalBindingCondition(item, this.condition);
        if (!result) {
            this._statusBar.setErrorMessage("No condition matched");
            return undefined;
        }

        if (result.commands || result.command) {
            await this.hide();
            const { commands, args } = toCommands(result);
            await executeCommands(commands, args);
            this._repeater?.record(this._itemHistory);
        }

        if (result.bindings) {
            this._statusBar.setPlainMessage(
                this.toHistoricalKeysString() + "-",
                0
            );
            const items = result.bindings;
            return {
                items,
                title: item.name,
                delay: this.delay,
                showMenu: true,
                buttons: WhichKeyMenu.NonRootMenuButtons,
            };
        } else {
            return undefined;
        }
    }

    protected override async handleMismatch(
        key: string
    ): Promise<OptionalWhichKeyMenuState> {
        const keyCombo = this.toHistoricalKeysString(key);
        this._statusBar.setErrorMessage(`${keyCombo} is undefined`);
        return undefined;
    }

    protected override handleRender(
        items: BindingItem[]
    ): BaseWhichKeyQuickPickItem<BindingItem>[] {
        items = items.filter((i) => i.display !== DisplayOption.Hidden);
        const max = items.reduce(
            (acc, val) => (acc > val.key.length ? acc : val.key.length),
            0
        );

        return items.map((i) => {
            const icon =
                this.showIcons && i.icon && i.icon.length > 0
                    ? `$(${i.icon})   `
                    : "";
            const label = this.useFullWidthCharacters
                ? toFullWidthSpecializedKey(i.key) +
                  toFullWidthKey(" ".repeat(max - i.key.length))
                : toSpecializedKey(i.key);
            return {
                label,
                description: `\t${icon}${i.name}`,
                item: i,
            };
        });
    }

    private toHistoricalKeysString(currentKey?: string): string {
        let keyCombo = this._itemHistory.map((i) => i.key);
        if (currentKey) {
            keyCombo = keyCombo.concat(currentKey);
        }
        return keyCombo.map(toSpecializedKey).join(" ");
    }

    override update(state: BaseWhichKeyMenuState<BindingItem>): void {
        this._stateHistory.push(state);
        super.update(state);
    }

    override dispose() {
        this._statusBar.hidePlain();
        for (const d of this.__disposables) {
            d.dispose();
        }

        super.dispose();
    }
}

export function showWhichKeyMenu(
    statusBar: StatusBar,
    cmdRelay: CommandRelay,
    repeater: WhichKeyRepeater | undefined,
    config: WhichKeyMenuConfig
) {
    const menu = new WhichKeyMenu(statusBar, cmdRelay, repeater);
    menu.delay = config.delay;
    menu.showIcons = config.showIcons;
    menu.showButtons = config.showButtons;
    menu.useFullWidthCharacters = config.useFullWidthCharacters;
    menu.update({
        items: config.bindings,
        title: config.title,
        delay: config.delay,
        showMenu: true,
        buttons: [WhichKeyMenu.SearchBindingButton],
    });

    // Explicitly not wait for the whole menu to resolve
    // to fix the issue where executing show command which can freeze vim instead of waiting on menu.
    // In addition, show command waits until we call menu show to allow chaining command of show and triggerKey.
    // Specifically, when triggerKey called before shown is done. The value will be set before shown, which causes the
    // value to be selected.
    (async () => {
        try {
            await Promise.all([
                new Promise<void>((resolve, reject) => {
                    menu.onDidResolve = resolve;
                    menu.onDidReject = reject;
                    menu.show();
                }),
                setContext(ContextKey.Active, true),
            ]);
        } catch (e: any) {
            window.showErrorMessage(e.toString());
        } finally {
            await Promise.all([
                setContext(ContextKey.Active, false),
                // We set visible to true before QuickPick is shown (because vscode doesn't provide onShown API)
                // Visible can be stuck in true if the menu is disposed before it's shown (e.g.
                // calling show without waiting and triggerKey command in sequence)
                // Therefore, we are cleaning up here to make sure it is not stuck.
                setContext(ContextKey.Visible, false),
            ]);
        }
    })();
}
