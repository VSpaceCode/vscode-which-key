import { Disposable } from "vscode";
import { CommandRelay } from "./commandRelay";
import { toBindingItem } from "./config/bindingItem";
import { defaultWhichKeyConfig, toWhichKeyConfig, toWhichKeyLayerConfig } from "./config/whichKeyConfig";
import { StatusBar } from "./statusBar";
import { notNullish } from "./utils";
import WhichKeyCommand from "./whichKeyCommand";

export class WhichKeyRegistry implements Disposable {
    private registry: Record<string, WhichKeyCommand>;
    private statusBar: StatusBar;
    private cmdRelay: CommandRelay;

    constructor(statusBar: StatusBar, cmdRelay: CommandRelay) {
        this.statusBar = statusBar;
        this.cmdRelay = cmdRelay;
        this.registry = {};
    }

    register(obj: any): boolean {
        const config = toWhichKeyConfig(obj);
        if (config) {
            const key = config.bindings;
            if (!this.has(key)) {
                this.registry[key] = new WhichKeyCommand(this.statusBar, this.cmdRelay);
            }

            this.registry[key].register(config);
            return true;
        }

        console.warn('Incorrect which-key config format.');
        return false;
    }

    registerLayer(obj: any): boolean {
        const layerConfig = toWhichKeyLayerConfig(obj);
        if (layerConfig) {
            const key = layerConfig.layers;
            if (!this.has(key)) {
                this.registry[key] = new WhichKeyCommand(this.statusBar, this.cmdRelay);
            }

            this.registry[key].registerLayer(layerConfig);
            return true;
        }

        console.warn('Incorrect which-key layer config format.');
        return false;
    }

    has(section: string): boolean {
        return section in this.registry;
    }

    show(args: any): Promise<void> {
        if (typeof args === 'string') {
            return this.registry[args].show();
        } else if (Array.isArray(args) && args.length > 0) {
            // Vim call command with an array with length of 0
            const bindings = args.map(toBindingItem).filter(notNullish);
            return WhichKeyCommand.show(bindings, this.statusBar, this.cmdRelay);
        } else {
            const key = defaultWhichKeyConfig.bindings;
            if (!this.has(key)) {
                this.register(defaultWhichKeyConfig);
            }
            return this.registry[key].show();
        }
    }

    repeatRecent(args: any): Promise<void> {
        return this.getRegister(args).showPreviousActions();
    }

    repeatMostRecent(args: any): Promise<void> {
        return this.getRegister(args).repeatLastAction();
    }

    private getRegister(args: any): WhichKeyCommand {
        if (typeof args === 'string') {
            return this.registry[args];
        } else {
            const key = defaultWhichKeyConfig.bindings;
            if (!this.has(key)) {
                this.register(defaultWhichKeyConfig);
            }
            return this.registry[key];
        }

    }

    unregister(section: string): void {
        if (this.has(section)) {
            this.registry[section].unregister();
        }
    }

    dispose(): void {
        for (const key of Object.keys(this.register)) {
            this.registry[key].unregister();
        }
    }
}
