import { window } from "vscode";
import { toCommands } from "../config/bindingItem";
import { CommandRelay } from "../commandRelay";
import { ContextKey } from "../constants";
import { IStatusBar } from "../statusBar";
import { executeCommands, setContext, specializeBindingKey } from "../utils";
import { WhichKeyRepeater } from "../whichKeyRepeater";
import { BaseWhichKeyMenu } from "./baseWhichKeyMenu";
import { WhichKeyMenuItem } from "./whichKeyMenuItem";
import { WhichKeyMenuConfig } from "../config/menuConfig";

class WhichKeyMenu extends BaseWhichKeyMenu<WhichKeyMenuItem>{
    private statusBar: IStatusBar;
    private repeater?: WhichKeyRepeater;
    private itemHistory: WhichKeyMenuItem[];

    delay: number = 0;
    private timeoutId?: NodeJS.Timeout;

    constructor(statusBar: IStatusBar, cmdRelay: CommandRelay, repeater?: WhichKeyRepeater) {
        super(cmdRelay);
        this.statusBar = statusBar;
        this.repeater = repeater;
        this.itemHistory = [];
    }

    protected async onItemNotMatch(value: string) {
        await this.hide();
        const keyCombo = this.toHistoricalKeysString(value);
        this.statusBar.setErrorMessage(`${keyCombo} is undefined`);
        this.resolve();
    }


    private toHistoricalKeysString(currentKey?: string) {
        let keyCombo = this.itemHistory.map(i => i.key);
        if (currentKey) {
            keyCombo = keyCombo.concat(currentKey);
        }
        return keyCombo.map(specializeBindingKey).join(' ');
    }

    protected async onDidHide() {
        this.clearDelay();
        super.onDidHide();
    }

    protected onVisibilityChange(visible: boolean) {
        return setContext(ContextKey.Visible, visible);
    }

    protected async handleAcceptance(item: WhichKeyMenuItem) {
        this.itemHistory.push(item);
        this.statusBar.hide();
        this.clearDelay();

        const result = item.evalCondition(this.condition);
        if (!result) {
            this.statusBar.setErrorMessage("No condition matched");
            this.resolve();
            return;
        }

        if (result.commands || result.command) {
            await this.hide();
            const { commands, args } = toCommands(result);
            await executeCommands(commands, args);
            this.repeater?.record(this.itemHistory);
        }

        if (result.bindings) {
            this.statusBar.setPlainMessage(this.toHistoricalKeysString() + "-", 0);
            this.items = result.bindings;
            this.title = item.name;
            await this.show();
        } else {
            this.resolve();
        }
    }

    private clearDelay() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = undefined;
        }
    }

    protected async update() {
        this.quickPick.placeholder = this.placeholder;
        this.quickPick.matchOnDetail = this.matchOnDetail;
        this.quickPick.matchOnDescription = this.matchOnDescription;
        await this.setValue(this.value);
        this.quickPick.busy = this.busy;
        this.timeoutId = setTimeout((() => {
            this.clearDelay();
            this.quickPick.title = this.title;
            this.quickPick.items = this.items;
        }).bind(this), this.delay);
    }

    dispose() {
        this.clearDelay();
        this.statusBar.hidePlain();
        super.dispose();
    }
}

export function showWhichKeyMenu(statusBar: IStatusBar, cmdRelay: CommandRelay, repeater: WhichKeyRepeater | undefined, config: WhichKeyMenuConfig) {
    const menu = new WhichKeyMenu(statusBar, cmdRelay, repeater);
    menu.items = config.bindings.map(b => new WhichKeyMenuItem(b));
    menu.delay = config.delay ?? 0;
    menu.title = config.title;
    // Explicitly not wait for the whole menu to resolve
    // to fix the issue where executing show command which can freeze vim instead of waiting on menu.
    // In addition, show command waits until we call menu show to allow chaining command of show and triggerKey.
    // Specifically, when triggerKey called before shown is done. The value will be set before shown, which causes the
    // value to be selected.
    waitForMenu(menu);
    return Promise.all([
        setContext(ContextKey.Active, true),
        menu.show()
    ]);
}

async function waitForMenu(menu: WhichKeyMenu) {
    try {
        await new Promise<void>((resolve, reject) => {
            menu.onDidResolve = resolve;
            menu.onDidReject = reject;
        });
    } catch (e) {
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
}
