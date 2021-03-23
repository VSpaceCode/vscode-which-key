import { Disposable } from "vscode";
import { toBindingItem } from "./config/bindingItem";
import { CommandRelay } from "./commandRelay";
import { StatusBar } from "./statusBar";
import WhichKeyCommand from "./whichKeyCommand";
import { defaultWhichKeyConfig, toWhichKeyConfig } from "./config/whichKeyConfig";

export class WhichKeyRegistry implements Disposable {
    private registry: Record<string, WhichKeyCommand>;
    private statusBar: StatusBar;
    private cmdRelay: CommandRelay;

    constructor(statusBar: StatusBar, cmdRelay: CommandRelay) {
        this.statusBar = statusBar;
        this.cmdRelay = cmdRelay;
        this.registry = {};
    }

    register(obj: any) {
        const config = toWhichKeyConfig(obj);
        if (config) {
            const key = config.bindings;
            if (!this.has(key)) {
                this.registry[key] = new WhichKeyCommand(this.statusBar, this.cmdRelay);
            }

            this.registry[key].register(config);
            return true;
        } else {
            console.warn('Incorrect which-key config format.');
            return false;
        }
    }

    has(section: string): boolean {
        return section in this.registry;
    }

    show(args: any) {
        if (typeof args === 'string') {
            return this.registry[args].show();
        } else if (Array.isArray(args)) {
            function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
                return value !== null && value !== undefined;
            }
            const bindings = args.map(toBindingItem).filter(notEmpty);
            return WhichKeyCommand.show(bindings, this.statusBar, this.cmdRelay);
        } else {
            const key = defaultWhichKeyConfig.bindings;
            if (!this.has(key)) {
                this.register(defaultWhichKeyConfig);
            }
            return this.registry[key].show();
        }
    }

    showPreviousAction(args: any) {
        return this.getRegister(args).showPreviousActions();
    }

    repeatLastAction(args: any) {
        return this.getRegister(args).repeatLastAction();
    }

    private getRegister(args: any) {
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

    unregister(section: string) {
        if (this.has(section)) {
            this.registry[section].unregister();
        }
    }

    dispose() {
        for (const key of Object.keys(this.register)) {
            this.registry[key].unregister();
        }
    }
}
