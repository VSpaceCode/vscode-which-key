import { commands, Disposable, workspace } from "vscode";
import { BindingItem, OverrideBindingItem } from "./bindingItem";
import { ConfigKey, ContextKey, contributePrefix, SortOrder } from "./constants";
import KeyListener from "./keyListener";
import { WhichKeyMenu } from "./menu/menu";
import MenuItem from "./menu/menuItem";
import { WhichKeyConfig } from "./whichKeyConfig";

export default class WhichKeyCommand {
    private keyListener: KeyListener;
    private items?: MenuItem[];
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
            this.items = MenuItem.createMenuItems(bindings);
        } else {
            this.items = undefined;
        }

        if (config.overrides) {
            const overrides = workspace
                .getConfiguration(config.overrides[0])
                .get<OverrideBindingItem[]>(config.overrides[1]);
            MenuItem.overrideMenuItems(this.items, overrides);
        }

        const sortOrder = workspace
            .getConfiguration(contributePrefix)
            .get<SortOrder>(ConfigKey.SortOrder) ?? SortOrder.None;
        MenuItem.sortMenuItems(this.items, sortOrder);

        this.onConfigChangeListener = workspace.onDidChangeConfiguration((e) => {
            if (
                e.affectsConfiguration(`${contributePrefix}.${ConfigKey.SortOrder}`) ||
                e.affectsConfiguration(`${config.bindings[0]}.${config.bindings[1]}`) ||
                (config.overrides && e.affectsConfiguration(`${config.overrides[0]}.${config.overrides[1]}`))
            ) {
                this.register(config);
            }
        }, this);
    }

    unregister() {
        this.items = undefined;
        this.onConfigChangeListener?.dispose();
    }

    show() {
        if (this.items) {
            return showMenu(this.keyListener, this.items, false, this.config?.title);
        } else {
            throw new Error("No bindings is available");
        }
    }

    static show(bindings: BindingItem[], keyWatcher: KeyListener) {
        const items = MenuItem.createMenuItems(bindings);
        return showMenu(keyWatcher, items, false);
    }
}

function setContext(key: string, value: any) {
    return commands.executeCommand("setContext", key, value);
}


async function showMenu(keyListener: KeyListener, items: MenuItem[], isTransient: boolean, title?: string) {
    try {
        const delay = workspace.getConfiguration(contributePrefix).get<number>(ConfigKey.Delay) ?? 0;
        await setContext(ContextKey.Active, true);
        await WhichKeyMenu.show(keyListener, items, isTransient, delay, title);
    } finally {
        await setContext(ContextKey.Active, false);
    }
}