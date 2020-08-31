import { Disposable, workspace } from "vscode";
import { BindingItem, OverrideBindingItem } from "./bindingItem";
import { ConfigKey, contributePrefix, SortOrder } from "./constants";
import KeyListener from "./keyListener";
import { WhichKeyMenu } from "./menu/menu";
import { BaseMenuItem, RootMenuItem } from "./menu/menuItem";
import { getFullSection, WhichKeyConfig } from "./whichKeyConfig";

export default class WhichKeyCommand {
    private keyListener: KeyListener;
    private root?: RootMenuItem;
    private config?: WhichKeyConfig;
    private onConfigChangeListener?: Disposable;
    constructor(keyListener: KeyListener) {
        this.keyListener = keyListener;
    }

    register(config: WhichKeyConfig) {
        this.unregister();
        this.config = config;

        const bindings = workspace
            .getConfiguration(config.bindings[0])
            .get<BindingItem[]>(config.bindings[1]);
        if (bindings) {
            this.root = new RootMenuItem(bindings);
        }

        if (config.overrides) {
            const overrides = workspace
                .getConfiguration(config.overrides[0])
                .get<OverrideBindingItem[]>(config.overrides[1]) ?? [];
            this.root?.override(overrides);
        }

        const sortOrder = workspace
            .getConfiguration(contributePrefix)
            .get<SortOrder>(ConfigKey.SortOrder) ?? SortOrder.None;
        this.root?.sortItems(sortOrder);

        this.onConfigChangeListener = workspace.onDidChangeConfiguration((e) => {
            if (
                e.affectsConfiguration(getFullSection([contributePrefix, ConfigKey.SortOrder])) ||
                e.affectsConfiguration(getFullSection(config.bindings)) ||
                (config.overrides && e.affectsConfiguration(getFullSection(config.overrides)))
            ) {
                this.register(config);
            }
        }, this);
    }

    unregister() {
        this.root = undefined;
        this.onConfigChangeListener?.dispose();
    }

    show() {
        const items = this.root?.select().items;
        if (items) {
            return showMenu(this.keyListener, items, false, this.config?.title);
        } else {
            throw new Error("No bindings are available");
        }
    }

    static show(bindings: BindingItem[], keyWatcher: KeyListener) {
        const items = new RootMenuItem(bindings).select().items!;
        return showMenu(keyWatcher, items, false);
    }
}

function showMenu(keyListener: KeyListener, items: BaseMenuItem[], isTransient: boolean, title?: string) {
    const delay = workspace.getConfiguration(contributePrefix).get<number>(ConfigKey.Delay) ?? 0;
    return WhichKeyMenu.show(keyListener, items, isTransient, delay, title);
}