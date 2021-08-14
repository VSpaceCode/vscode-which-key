import { Disposable, workspace } from "vscode";
import { getCanonicalBindingsFromConfig, getCanonicalBindingsFromLayerConfig } from "./bindingConversion";
import { CommandRelay } from "./commandRelay";
import { BindingItem } from "./config/bindingItem";
import { WhichKeyConfig, WhichKeyLayerConfig } from "./config/whichKeyConfig";
import { Configs } from "./constants";
import { showWhichKeyMenu } from "./menu/whichKeyMenu";
import { StatusBar } from "./statusBar";
import { getConfig } from "./utils";
import { WhichKeyRepeater } from "./whichKeyRepeater";

export default class WhichKeyCommand {
    private statusBar: StatusBar;
    private cmdRelay: CommandRelay;
    private repeater: WhichKeyRepeater;
    private bindingItems?: BindingItem[];
    private title?: string;
    private onConfigChangeListener?: Disposable;
    constructor(statusBar: StatusBar, cmdRelay: CommandRelay) {
        this.statusBar = statusBar;
        this.cmdRelay = cmdRelay;
        this.repeater = new WhichKeyRepeater(statusBar, cmdRelay);
    }

    register(config: WhichKeyConfig): void {
        this.unregister();
        this.title = config.title;

        this.bindingItems = getCanonicalBindingsFromConfig(config);
        this.onConfigChangeListener = workspace.onDidChangeConfiguration((e) => {
            if (
                e.affectsConfiguration(Configs.SortOrder) ||
                e.affectsConfiguration(config.bindings) ||
                (config.overrides && e.affectsConfiguration(config.overrides))
            ) {
                this.register(config);
            }
        }, this);
    }

    registerLayer(config: WhichKeyLayerConfig): void {
        this.unregister();
        this.title = config.title;

        this.bindingItems = getCanonicalBindingsFromLayerConfig(config);
        this.onConfigChangeListener = workspace.onDidChangeConfiguration((e) => {
            if (
                e.affectsConfiguration(Configs.SortOrder) ||
                e.affectsConfiguration(config.layers) ||
                (config.overrides && e.affectsConfiguration(config.overrides))
            ) {
                this.registerLayer(config);
            }
        }, this);
    }

    unregister(): void {
        this.onConfigChangeListener?.dispose();
        this.repeater.clear();
    }

    show(): Promise<void> {
        const delay = getConfig<number>(Configs.Delay) ?? 0;
        const showIcons = getConfig<boolean>(Configs.ShowIcons) ?? true;
        const config = {
            bindings: this.bindingItems!,
            delay,
            showIcons,
            title: this.title
        };
        return showWhichKeyMenu(this.statusBar, this.cmdRelay, this.repeater, config);
    }

    showPreviousActions(): Promise<void> {
        return this.repeater.show();
    }

    repeatLastAction(): Promise<void> {
        return this.repeater.repeatLastAction();
    }

    static show(bindings: BindingItem[], statusBar: StatusBar, cmdRelay: CommandRelay): Promise<void> {
        const delay = getConfig<number>(Configs.Delay) ?? 0;
        const showIcons = getConfig<boolean>(Configs.ShowIcons) ?? true;
        const config = { bindings, delay, showIcons };
        return showWhichKeyMenu(statusBar, cmdRelay, undefined, config);
    }
}
