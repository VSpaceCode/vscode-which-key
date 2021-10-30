import { Disposable, window } from "vscode";
import { CommandRelay } from "../commandRelay";
import { toCommands } from "../config/bindingItem";
import { Condition } from "../config/condition";
import { WhichKeyMenuConfig } from "../config/menuConfig";
import { ContextKey } from "../constants";
import { StatusBar } from "../statusBar";
import { executeCommands, setContext, specializeBindingKey } from "../utils";
import { WhichKeyRepeater } from "../whichKeyRepeater";
import { BaseWhichKeyMenu, OptionalBaseWhichKeyMenuState } from "./baseWhichKeyMenu";
import { showDescBindMenu } from "./descBindMenu";
import { createDescBindItems } from "./descBindMenuItem";
import { WhichKeyMenuItem } from "./whichKeyMenuItem";

type OptionalWhichKeyMenuState = OptionalBaseWhichKeyMenuState<WhichKeyMenuItem>;

class WhichKeyMenu extends BaseWhichKeyMenu<WhichKeyMenuItem> {
    private _itemHistory: WhichKeyMenuItem[];
    private __disposables: Disposable[];

    private _statusBar: StatusBar;
    private _repeater?: WhichKeyRepeater;
    private _delay: number;

    constructor(statusBar: StatusBar, cmdRelay: CommandRelay, repeater?: WhichKeyRepeater, delay = 0) {
        super(cmdRelay);
        this._statusBar = statusBar;
        this._repeater = repeater;
        this._delay = delay;

        this._itemHistory = [];
        this.__disposables = [
            cmdRelay.onDidSearchBindings(this.handleDidSearchBindings, this),
            this.onDidHide(() => setContext(ContextKey.Visible, false)),
            this.onDidShow(() => setContext(ContextKey.Visible, true))
        ];
    }

    private get condition(): Condition {
        const languageId = window.activeTextEditor?.document.languageId;
        return {
            when: this.when,
            languageId
        };
    }

    private handleDidSearchBindings(): Promise<void> {
        const items = createDescBindItems(this.state.items, this._itemHistory);
        return showDescBindMenu(items, "Search Keybindings");
    }

    protected override async handleAccept(item: WhichKeyMenuItem) {
        this._itemHistory.push(item);
        this._statusBar.hide();

        const result = item.evalCondition(this.condition);
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
            this._statusBar.setPlainMessage(this.toHistoricalKeysString() + "-", 0);
            const items = result.bindings;
            return {
                title: item.name,
                items,
                delay: this._delay,
                showMenu: true,
            };
        } else {
            return undefined;
        }
    }

    protected override async handleMismatch(key: string):
        Promise<OptionalWhichKeyMenuState> {
        const keyCombo = this.toHistoricalKeysString(key);
        this._statusBar.setErrorMessage(`${keyCombo} is undefined`);
        return undefined;
    }

    private toHistoricalKeysString(currentKey?: string): string {
        let keyCombo = this._itemHistory.map(i => i.key);
        if (currentKey) {
            keyCombo = keyCombo.concat(currentKey);
        }
        return keyCombo.map(specializeBindingKey).join(' ');
    }

    override dispose() {
        this._statusBar.hidePlain();
        for (const d of this.__disposables) {
            d.dispose();
        }

        super.dispose();
    }

}

export function showWhichKeyMenu(statusBar: StatusBar, cmdRelay: CommandRelay, repeater: WhichKeyRepeater | undefined, config: WhichKeyMenuConfig) {
    const menu = new WhichKeyMenu(statusBar, cmdRelay, repeater, config.delay);
    menu.update({
        items: config.bindings.map(b => new WhichKeyMenuItem(b, config.showIcons)),
        title: config.title,
        delay: config.delay,
        showMenu: true,
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
                setContext(ContextKey.Visible, false)
            ]);
        }
    })();
}

