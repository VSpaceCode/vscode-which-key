import { EventEmitter } from "vscode";

export interface KeybindingArgs {
    key: string,
    when?: string,
}

export class CommandRelay {
    private keyEmitter: EventEmitter<KeybindingArgs>;
    private zenModeEmitter: EventEmitter<void>;
    constructor() {
        this.keyEmitter = new EventEmitter<KeybindingArgs>();
        this.zenModeEmitter = new EventEmitter<void>();
    }

    triggerKey(key: string | KeybindingArgs) {
        if (typeof key === "string") {
            key = { key };
        }
        this.keyEmitter.fire(key);
    }

    get onDidKeyPressed() {
        return this.keyEmitter.event;
    }

    toggleZenMode() {
        this.zenModeEmitter.fire();
    }

    get onDidToggleZenMode() {
        return this.zenModeEmitter.event;
    }

    dispose() {
        this.keyEmitter.dispose();
        this.zenModeEmitter.dispose();
    }
}
