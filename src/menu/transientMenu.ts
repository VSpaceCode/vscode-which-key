import { Disposable } from "vscode";
import { CommandRelay } from "../commandRelay";
import { toCommands } from "../config/bindingItem";
import { MaybeConfig, resolveMaybeConfig, TransientMenuConfig } from "../config/menuConfig";
import { Configs, ContextKey } from "../constants";
import { StatusBar } from "../statusBar";
import { executeCommands, getConfig, setContext, specializeBindingKey } from "../utils";
import { BaseWhichKeyMenu, OptionalBaseWhichKeyMenuState } from "./baseWhichKeyMenu";
import { TransientMenuItem } from "./transientMenuItem";

type OptionalTransientMenuState = OptionalBaseWhichKeyMenuState<TransientMenuItem>;

class TransientMenu extends BaseWhichKeyMenu<TransientMenuItem> {
    private _statusBar: StatusBar;
    private __disposables: Disposable[];

    constructor(statusBar: StatusBar, cmdRelay: CommandRelay) {
        super(cmdRelay);
        this._statusBar = statusBar;
        this.__disposables = [
            cmdRelay.onDidToggleZenMode(this.toggleZenMode, this),
            this.onDidHide(() => setContext(ContextKey.TransientVisible, false)),
            this.onDidShow(() => setContext(ContextKey.TransientVisible, true))
        ];
    }

    protected override async handleAccept(item: TransientMenuItem):
        Promise<OptionalTransientMenuState> {
        await this.hide();
        const { commands, args } = toCommands(item);
        await executeCommands(commands, args);

        return item.exit !== true ? this.state : undefined;
    }

    protected override async handleMismatch(key: string):
        Promise<OptionalTransientMenuState> {
        this._statusBar.setErrorMessage(`${specializeBindingKey(key ?? 'key')} is undefined`);
        return undefined;
    }

    override dispose() {
        this._statusBar.hidePlain();
        for (const d of this.__disposables) {
            d.dispose();
        }

        super.dispose();
    }

    toggleZenMode(): void {
        this.update({
            ...this.state,
            showMenu: !this.state.showMenu
        });
    }
}

export function showTransientMenu(statusBar: StatusBar, cmdRelay: CommandRelay, config: MaybeConfig<TransientMenuConfig>): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const menu = new TransientMenu(statusBar, cmdRelay);
        const menuConfig = resolveMaybeConfig(config);
        const showIcons = menuConfig?.showIcons ?? getConfig<boolean>(Configs.ShowIcons) ?? true;
        menu.update({
            title: menuConfig?.title,
            items: menuConfig?.bindings.map(b => new TransientMenuItem(b, showIcons)) ?? [],
            delay: 0,
            showMenu: true
        });
        menu.onDidResolve = resolve;
        menu.onDidReject = reject;
        menu.show();
    });
}
