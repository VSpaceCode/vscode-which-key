import { Disposable } from "vscode";
import { CommandRelay } from "../commandRelay";
import {
    DisplayOption,
    toCommands,
    TransientBindingItem,
} from "../config/bindingItem";
import {
    MaybeConfig,
    resolveMaybeConfig,
    TransientMenuConfig,
} from "../config/menuConfig";
import { Configs, ContextKey } from "../constants";
import { StatusBar } from "../statusBar";
import {
    executeCommands,
    getConfig,
    setContext,
    toFullWidthKey,
    toFullWidthSpecializedKey,
    toSpecializedKey,
} from "../utils";
import {
    BaseWhichKeyMenu,
    BaseWhichKeyQuickPickItem,
    OptionalBaseWhichKeyMenuState,
} from "./baseWhichKeyMenu";

type OptionalTransientMenuState =
    OptionalBaseWhichKeyMenuState<TransientBindingItem>;

class TransientMenu extends BaseWhichKeyMenu<TransientBindingItem> {
    private _statusBar: StatusBar;
    private __disposables: Disposable[];

    showIcon = true;
    useFullWidthCharacters = false;

    constructor(statusBar: StatusBar, cmdRelay: CommandRelay) {
        super(cmdRelay);
        this._statusBar = statusBar;
        this.__disposables = [
            cmdRelay.onDidToggleZenMode(this.toggleZenMode, this),
            this.onDidHide(() =>
                setContext(ContextKey.TransientVisible, false)
            ),
            this.onDidShow(() => setContext(ContextKey.TransientVisible, true)),
        ];
    }

    protected override async handleAccept(
        item: TransientBindingItem
    ): Promise<OptionalTransientMenuState> {
        await this.hide();
        const { commands, args } = toCommands(item);
        await executeCommands(commands, args);

        return item.exit !== true ? this.state : undefined;
    }

    protected override async handleMismatch(
        key: string
    ): Promise<OptionalTransientMenuState> {
        const msg = `${toSpecializedKey(key)} is undefined`;
        this._statusBar.setErrorMessage(msg);
        return undefined;
    }

    protected override handleRender(
        items: TransientBindingItem[]
    ): BaseWhichKeyQuickPickItem<TransientBindingItem>[] {
        items = items.filter((i) => i.display !== DisplayOption.Hidden);
        const max = items.reduce(
            (acc, val) => (acc > val.key.length ? acc : val.key.length),
            0
        );

        return items.map((i) => {
            const icon =
                this.showIcon && i.icon && i.icon.length > 0
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
            showMenu: !this.state.showMenu,
        });
    }
}

export function showTransientMenu(
    statusBar: StatusBar,
    cmdRelay: CommandRelay,
    config: MaybeConfig<TransientMenuConfig>
): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const menuConfig = resolveMaybeConfig(config);
        const menu = new TransientMenu(statusBar, cmdRelay);
        menu.showIcon =
            menuConfig?.showIcons ??
            getConfig<boolean>(Configs.ShowIcons) ??
            true;
        menu.useFullWidthCharacters =
            menuConfig?.useFullWidthCharacters ??
            getConfig<boolean>(Configs.UseFullWidthCharacters) ??
            false;
        menu.onDidResolve = resolve;
        menu.onDidReject = reject;
        menu.update({
            title: menuConfig?.title,
            items: menuConfig?.bindings ?? [],
            delay: 0,
            showMenu: true,
        });
        menu.show();
    });
}
