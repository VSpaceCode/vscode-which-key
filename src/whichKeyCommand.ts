import { Disposable, workspace } from "vscode";
import { BindingItem, OverrideBindingItem } from "./bindingItem";
import { ConfigKey, contributePrefix, SortOrder } from "./constants";
import KeyListener from "./keyListener";
import { WhichKeyMenu } from "./menu/menu";
import { BaseMenuItem, RootMenuItem } from "./menu/menuItem";
import { IStatusBar } from "./statusBar";
import { getFullSection, WhichKeyConfig } from "./whichKeyConfig";

export default class WhichKeyCommand {
    private statusBar: IStatusBar;
    private keyListener: KeyListener;
    private root?: RootMenuItem;
    private config?: WhichKeyConfig;
    private onConfigChangeListener?: Disposable;
    constructor(statusBar: IStatusBar, keyListener: KeyListener) {
        this.keyListener = keyListener;
        this.statusBar = statusBar;
    }

    register(config: WhichKeyConfig) {
        this.unregister();
        this.config = config;

        const bindings = getConfig<BindingItem[]>(config.bindings);
        if (bindings) {
            this.root = new RootMenuItem(bindings);
        }

        if (config.overrides) {
            const overrides = getConfig<OverrideBindingItem[]>(config.overrides) ?? [];
            this.root?.override(overrides);
        }

        const sortOrder = workspace
            .getConfiguration(contributePrefix)
            .get<SortOrder>(ConfigKey.SortOrder) ?? SortOrder.None;
        this.root?.sortItems(sortOrder);

        this.onConfigChangeListener = workspace.onDidChangeConfiguration((e) => {
            if (
                e.affectsConfiguration(getFullSection([contributePrefix, ConfigKey.SortOrder])) ||
                e.affectsConfiguration(config.bindings) ||
                (config.overrides && e.affectsConfiguration(config.overrides))
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
            return showMenu(this.statusBar, this.keyListener, items, false, this.config?.title);
        } else {
            throw new Error("No bindings are available");
        }
    }

    static show(bindings: BindingItem[], statusBar: IStatusBar, keyWatcher: KeyListener) {
        const items = new RootMenuItem(bindings).select().items!;
        return showMenu(statusBar, keyWatcher, items, false);
    }
}

function showMenu(statusBar: IStatusBar, keyListener: KeyListener, items: BaseMenuItem[], isTransient: boolean, title?: string) {
    const delay = workspace.getConfiguration(contributePrefix).get<number>(ConfigKey.Delay) ?? 0;
    return WhichKeyMenu.show(statusBar, keyListener, items, isTransient, delay, title);
}

function getConfig<T>(section: string) {
    // Get the minimal scope
    const idx = section.lastIndexOf('.');
    if (idx === -1) {
        return workspace.getConfiguration().get<T>(section);
    } else {
        return workspace.getConfiguration(section.substring(0, idx))
            .get<T>(section.substring(idx + 1));
    }
}