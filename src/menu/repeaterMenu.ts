import { CommandRelay } from "../commandRelay";
import { IStatusBar } from "../statusBar";
import { BaseWhichKeyMenu, IBaseWhichKeyMenuItem } from "./baseWhichKeyMenu";

export interface IRepeaterMenuItem extends IBaseWhichKeyMenuItem {
    accept: () => Thenable<unknown>;
}

class RepeaterMenu extends BaseWhichKeyMenu<IRepeaterMenuItem> {
    private statusBar: IStatusBar;

    constructor(statusBar: IStatusBar, cmdRelay: CommandRelay) {
        super(cmdRelay);
        this.statusBar = statusBar;
    }

    protected async onItemNotMatch(value: string) {
        await this.hide();
        this.statusBar.setErrorMessage(`${value} is undefined`);
        this.resolve();
    }

    protected async handleAcceptance(item: IRepeaterMenuItem) {
        this.statusBar.hide();

        await this.hide();
        await item.accept();
        this.resolve();
    }
}

export function showRepeaterMenu(statusBar: IStatusBar, cmdRelay: CommandRelay, items: IRepeaterMenuItem[], title?: string) {
    return new Promise<void>((resolve, reject) => {
        const menu = new RepeaterMenu(statusBar, cmdRelay);
        menu.title = title;
        menu.items = items;
        menu.onDidResolve = resolve;
        menu.onDidReject = reject;
        menu.show();
    });
}