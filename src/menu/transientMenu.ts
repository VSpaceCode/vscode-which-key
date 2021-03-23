import { CommandRelay } from "../commandRelay";
import { resolveBindings, TransientMenuConfig } from "../config/menuConfig";
import { ContextKey } from "../constants";
import { StatusBar } from "../statusBar";
import { executeCommands, setContext, specializeBindingKey } from "../utils";
import { BaseWhichKeyMenu } from "./baseWhichKeyMenu";
import { TransientMenuItem } from "./transientMenuItem";

class TransientMenu extends BaseWhichKeyMenu<TransientMenuItem> {
    private statusBar: StatusBar;
    private isInZenMode: boolean;

    constructor(statusBar: StatusBar, cmdRelay: CommandRelay) {
        super(cmdRelay);
        this.disposables.push(
            cmdRelay.onDidToggleZenMode(this.toggleZenMode, this)
        );
        this.statusBar = statusBar;
        this.isInZenMode = false;
    }

    protected async onItemNotMatch(value: string): Promise<void> {
        this.value = "";
        this.update();
        this.statusBar.setErrorMessage(`${specializeBindingKey(value)} is undefined`);
    }

    protected onVisibilityChange(visible: boolean): Thenable<unknown> {
        return setContext(ContextKey.TransientVisible, visible);
    }

    protected async handleAcceptance(item: TransientMenuItem): Promise<void> {
        await this.hide();
        if (item.commands) {
            await executeCommands(item.commands, item.args);
        }

        if (item.exit === true) {
            this.resolve();
        } else {
            await this.show();
        }
    }

    protected async update(): Promise<void> {
        this.quickPick.matchOnDetail = this.matchOnDetail;
        this.quickPick.placeholder = this.placeholder;
        this.quickPick.matchOnDescription = this.matchOnDescription;
        await this.setValue(this.value);
        this.quickPick.busy = this.busy;
        if (!this.isInZenMode) {
            this.quickPick.title = this.title;
            this.quickPick.items = this.items;
        }
    }

    exitZenMode(): void {
        this.quickPick.items = this.items;
        this.quickPick.title = this.title;
        this.isInZenMode = false;
    }

    enterZenMode(): void {
        this.quickPick.items = [];
        this.quickPick.title = "";
        this.isInZenMode = true;
    }

    toggleZenMode(): void {
        if (this.isInZenMode) {
            this.exitZenMode();
        } else {
            this.enterZenMode();
        }
    }
}

export function showTransientMenu(statusBar: StatusBar, cmdRelay: CommandRelay, config: TransientMenuConfig): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const menu = new TransientMenu(statusBar, cmdRelay);
        menu.title = config.title;
        menu.items = resolveBindings(config.bindings).map(b => new TransientMenuItem(b));
        menu.onDidResolve = resolve;
        menu.onDidReject = reject;
        menu.show();
    });
}
