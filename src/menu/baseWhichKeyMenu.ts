import { QuickPickItem, window } from "vscode";
import { CommandRelay, KeybindingArgs } from "../commandRelay";
import { Condition } from "../config/condition";
import { BaseMenu } from "./baseMenu";

export interface BaseWhichKeyMenuItem extends QuickPickItem {
    key: string;
    name: string;
}

export abstract class BaseWhichKeyMenu<T extends BaseWhichKeyMenuItem> extends BaseMenu<T> {
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

    protected get condition(): Condition {
        const languageId = window.activeTextEditor?.document.languageId;
        return {
            when: this.when,
            languageId
        };
    }

    protected async onDidKeyPressed(value: KeybindingArgs): Promise<void> {
        await this.setValue(this.quickPick.value + value.key);
        await this.onDidChangeValue(this.quickPick.value, value.when);
    }

    protected async onDidChangeValue(value: string, when?: string): Promise<void> {
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