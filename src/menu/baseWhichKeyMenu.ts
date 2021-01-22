import { QuickPickItem, window } from "vscode";
import { CommandRelay, KeybindingArgs } from "../commandRelay";
import { BaseMenu } from "./baseMenu";

export interface IBaseWhichKeyMenuItem extends QuickPickItem {
    key: string,
    name: string,
}

export abstract class BaseWhichKeyMenu<T extends IBaseWhichKeyMenuItem> extends BaseMenu<T> {
    /**
     * This used to stored the last when condition from the key listener
     */
    private when?: string;

    constructor(cmdRelay: CommandRelay) {
        super();
        this.disposables.push(
            cmdRelay.onDidKeyPressed(this.onDidKeyPressed, this)
        );
    }

    protected get condition() {
        const languageId = window.activeTextEditor?.document.languageId;
        return {
            when: this.when,
            languageId
        };
    }

    protected onDidKeyPressed(value: KeybindingArgs) {
        this.quickPick.value += value.key;
        this.onDidChangeValue(this.quickPick.value, value.when);
    }

    protected async onDidChangeValue(value: string, when?: string) {
        this.when = when;

        const chosenItem = this.items.find(i => i.key === value);
        const hasSeq = this.items.find(i => value.startsWith(i.key));
        if (hasSeq) {
            if (chosenItem) {
                await this.accept(chosenItem);
            }
        } else {
            await this.onItemNotMatch(value);
        }
    }

    protected abstract onItemNotMatch(value: string): Thenable<unknown>;
}