import { QuickPickItem } from "vscode";
import { executeCommands } from "../utils";
import { BaseMenu } from "./baseMenu";

export interface DescBindMenuItem extends QuickPickItem {
    commands?: string[];
    args?: string[];
    items?: DescBindMenuItem[];
}

class DescBindMenu extends BaseMenu<DescBindMenuItem> {
    protected async handleAcceptance(val: DescBindMenuItem) {
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

export function showDescBindMenu(items: DescBindMenuItem[], title?: string) {
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