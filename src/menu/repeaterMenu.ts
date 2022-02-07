import { CommandRelay } from "../commandRelay";
import { StatusBar } from "../statusBar";
import {
    toFullWidthKey,
    toFullWidthSpecializedKey,
    toSpecializedKey,
} from "../utils";
import {
    BaseWhichKeyMenu,
    BaseWhichKeyMenuItem,
    BaseWhichKeyQuickPickItem,
    OptionalBaseWhichKeyMenuState,
} from "./baseWhichKeyMenu";

export interface RepeaterMenuItem extends BaseWhichKeyMenuItem {
    name: string;
    basePathNames: string[];
    accept: () => Thenable<unknown>;
}

export interface RepeaterMenuConfig {
    title?: string;
    useFullWidthCharacters: boolean;
    items: RepeaterMenuItem[];
}

type OptionalRepeatMenuState = OptionalBaseWhichKeyMenuState<RepeaterMenuItem>;

class RepeaterMenu extends BaseWhichKeyMenu<RepeaterMenuItem> {
    private _statusBar: StatusBar;

    useFullWidthCharacters = false;

    constructor(statusBar: StatusBar, cmdRelay: CommandRelay) {
        super(cmdRelay);
        this._statusBar = statusBar;
    }

    protected override async handleAccept(
        item: RepeaterMenuItem
    ): Promise<OptionalRepeatMenuState> {
        this._statusBar.hide();

        await this.hide();
        await item.accept();
        return undefined;
    }

    protected override async handleMismatch(
        key: string
    ): Promise<OptionalRepeatMenuState> {
        const msg = `${toSpecializedKey(key)} is undefined`;
        this._statusBar.setErrorMessage(msg);
        return undefined;
    }

    protected override handleRender(
        items: RepeaterMenuItem[]
    ): BaseWhichKeyQuickPickItem<RepeaterMenuItem>[] {
        const max = items.reduce(
            (acc, val) => (acc > val.key.length ? acc : val.key.length),
            0
        );
        return items.map((i) => {
            const label = this.useFullWidthCharacters
                ? toFullWidthSpecializedKey(i.key) +
                  toFullWidthKey(" ".repeat(max - i.key.length))
                : toSpecializedKey(i.key);
            return {
                label,
                description: `\t${i.name}`,
                detail: i.basePathNames.join("$(chevron-right)"),
                item: i,
            };
        });
    }
}

export function showRepeaterMenu(
    statusBar: StatusBar,
    cmdRelay: CommandRelay,
    config: RepeaterMenuConfig
): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const menu = new RepeaterMenu(statusBar, cmdRelay);
        menu.useFullWidthCharacters = config.useFullWidthCharacters;
        menu.update({
            title: config.title,
            items: config.items,
            delay: 0,
            showMenu: true,
        });
        menu.onDidResolve = resolve;
        menu.onDidReject = reject;
        menu.show();
    });
}
