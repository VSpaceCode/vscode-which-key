import { CommandRelay } from "../commandRelay";
import { StatusBar } from "../statusBar";
import { specializeBindingKey } from "../utils";
import { BaseWhichKeyMenu, BaseWhichKeyMenuItem, OptionalBaseWhichKeyMenuState } from "./baseWhichKeyMenu";

export interface RepeaterMenuItem extends BaseWhichKeyMenuItem {
    name: string,
    accept: () => Thenable<unknown>;
}

type OptionalRepeatMenuState = OptionalBaseWhichKeyMenuState<RepeaterMenuItem>;

class RepeaterMenu extends BaseWhichKeyMenu<RepeaterMenuItem> {
    private _statusBar: StatusBar;

    constructor(statusBar: StatusBar, cmdRelay: CommandRelay) {
        super(cmdRelay);
        this._statusBar = statusBar;
    }

    protected override async handleAccept(item: RepeaterMenuItem):
        Promise<OptionalRepeatMenuState> {
        this._statusBar.hide();

        await this.hide();
        await item.accept();
        return undefined;
    }

    protected override async handleMismatch(key: string): Promise<OptionalRepeatMenuState> {
        const msg = `${specializeBindingKey(key)} is undefined`;
        this._statusBar.setErrorMessage(msg);
        return undefined;
    }
}

export function showRepeaterMenu(statusBar: StatusBar, cmdRelay: CommandRelay, items: RepeaterMenuItem[], title?: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const menu = new RepeaterMenu(statusBar, cmdRelay);
        menu.update({
            title,
            items: items,
            delay: 0,
            showMenu: true
        });
        menu.onDidResolve = resolve;
        menu.onDidReject = reject;
        menu.show();
    });
}
