import { Disposable } from "vscode";
import { toBindingItem } from "./config/bindingItem";
import { CommandRelay } from "./commandRelay";
import { StatusBar } from "./statusBar";
import WhichKeyCommand from "./whichKeyCommand";
import {
    defaultWhichKeyConfig,
    toWhichKeyConfig,
} from "./config/whichKeyConfig";

function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
    return value !== null && value !== undefined;
}

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
                this.registry[key] = new WhichKeyCommand(
                    this.statusBar,
                    this.cmdRelay
                );
            }

            this.registry[key].register(config);
            return true;
        } else {
            console.warn("Incorrect which-key config format.");
            return false;
        }
    }

    has(section: string): boolean {
        return section in this.registry;
    }

    show(args: any): void {
        if (typeof args === "string") {
            this.registry[args].show();
        } else if (Array.isArray(args) && args.length > 0) {
            // Vim call command with an array with length of 0
            const bindings = args.map(toBindingItem).filter(notEmpty);
            WhichKeyCommand.show(bindings, this.statusBar, this.cmdRelay);
        } else {
            const key = defaultWhichKeyConfig.bindings;
            if (!this.has(key)) {
                this.register(defaultWhichKeyConfig);
            }
            this.registry[key].show();
        }
    }

    repeatRecent(args: any): Promise<void> {
        return this.getRegister(args).showPreviousActions();
    }

    repeatMostRecent(args: any): Promise<void> {
        return this.getRegister(args).repeatLastAction();
    }

    private getRegister(args: any): WhichKeyCommand {
        if (typeof args === "string") {
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
