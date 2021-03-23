import { CommandRelay } from "../commandRelay";
import { StatusBar } from "../statusBar";
import { BaseWhichKeyMenu, BaseWhichKeyMenuItem } from "./baseWhichKeyMenu";

export interface RepeaterMenuItem extends BaseWhichKeyMenuItem {
    accept: () => Thenable<unknown>;
}

class RepeaterMenu extends BaseWhichKeyMenu<RepeaterMenuItem> {
    private statusBar: StatusBar;

    constructor(statusBar: StatusBar, cmdRelay: CommandRelay) {
        super(cmdRelay);
        this.statusBar = statusBar;
    }

    protected async onItemNotMatch(value: string): Promise<void> {
        await this.hide();
        this.statusBar.setErrorMessage(`${value} is undefined`);
        this.resolve();
    }

    protected async handleAcceptance(item: RepeaterMenuItem): Promise<void> {
        this.statusBar.hide();

        await this.hide();
        await item.accept();
        this.resolve();
    }
}

export function showRepeaterMenu(statusBar: StatusBar, cmdRelay: CommandRelay, items: RepeaterMenuItem[], title?: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const menu = new RepeaterMenu(statusBar, cmdRelay);
        menu.title = title;
        menu.items = items;
        menu.onDidResolve = resolve;
        menu.onDidReject = reject;
        menu.show();
    });
}