import { Event, EventEmitter } from "vscode";

export interface KeybindingArgs {
    key: string;
    when?: string;
}

export class CommandRelay {
    private keyEmitter: EventEmitter<KeybindingArgs>;
    private zenModeEmitter: EventEmitter<void>;
    private searchBindingsEmitter: EventEmitter<void>;

    constructor() {
        this.keyEmitter = new EventEmitter<KeybindingArgs>();
        this.zenModeEmitter = new EventEmitter<void>();
        this.searchBindingsEmitter = new EventEmitter<void>();
    }

    triggerKey(key: string | KeybindingArgs): void {
        if (typeof key === "string") {
            key = { key };
        }
        this.keyEmitter.fire(key);
    }

    get onDidKeyPressed(): Event<KeybindingArgs> {
        return this.keyEmitter.event;
    }

    toggleZenMode(): void {
        this.zenModeEmitter.fire();
    }

    get onDidToggleZenMode(): Event<void> {
        return this.zenModeEmitter.event;
    }

    searchBindings(): void {
        this.searchBindingsEmitter.fire();
    }

    get onDidSearchBindings(): Event<void> {
        return this.searchBindingsEmitter.event;
    }

    dispose(): void {
        this.keyEmitter.dispose();
        this.zenModeEmitter.dispose();
        this.searchBindingsEmitter.dispose();
    }
}
