import { executeCommands } from "../utils";
import { BaseMenu } from "./baseMenu";
import { DescBindMenuItem } from "./descBindMenuItem";

class DescBindMenu extends BaseMenu<DescBindMenuItem> {
    protected async handleAcceptance(val: DescBindMenuItem): Promise<void> {
        if (val.commands) {
            await this.hide();
            await executeCommands(val.commands, val.args);
        }

        if (val.items) {
            this.placeholder = val.description;
            this.items = val.items;
            await this.show();
        } else {
            this.resolve();
        }
    }
}

export function showDescBindMenu(items: DescBindMenuItem[], title?: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const menu = new DescBindMenu();
        menu.matchOnDescription = true;
        menu.matchOnDetail = true;
        menu.items = items;
        menu.title = title;
        menu.onDidResolve = resolve;
        menu.onDidReject = reject;
        menu.show();
    });
}