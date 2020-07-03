import { Disposable, window, workspace } from "vscode";
import { BindingItem, OverrideBindingItem } from "./BindingItem";
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
            this.items = MenuItem.createItems(bindings);
        } else {
            this.items = undefined;
        }

        if (config.overrides) {
            const overrides = workspace
                .getConfiguration(config.overrides[0])
                .get<OverrideBindingItem[]>(config.overrides[1]);
            MenuItem.overrideItems(this.items, overrides);
        }

        this.onConfigChangeListener = workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration(config.bindings[0])) {
                this.register(config);
            }

            // Only if the sections are different to avoid re-register
            if (config.overrides && config.overrides[0] !== config.bindings[0]) {
                if (e.affectsConfiguration(config.bindings[0])) {
                    this.register(config);
                }
            }
        });
    }

    unregister() {
        this.items = undefined;
        this.onConfigChangeListener?.dispose();
    }

    show(): Thenable<unknown> {
        if (this.items) {
            return WhichKeyMenu.show(this.keyListener, this.items, false, this.config?.title);
        } else {
            return window.showErrorMessage("No bindings is available");
        }
    }

    static show(bindings: BindingItem[], keyWatcher: KeyListener) {
        const items = MenuItem.createItems(bindings);
        return WhichKeyMenu.show(keyWatcher, items, false);
    }
}
