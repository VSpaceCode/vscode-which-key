import { Event, EventEmitter } from "vscode";

export interface KeybindingArgs {
    key: string;
    when?: string;
}

export class CommandRelay {
    private keyEmitter: EventEmitter<KeybindingArgs>;
    private zenModeEmitter: EventEmitter<void>;
    private describeBindingEmitter: EventEmitter<void>;

    constructor() {
        this.keyEmitter = new EventEmitter<KeybindingArgs>();
        this.zenModeEmitter = new EventEmitter<void>();
        this.describeBindingEmitter = new EventEmitter<void>();
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

    describeBindings(): void {
        this.describeBindingEmitter.fire();
    }

    get onDescribeBindings(): Event<void> {
        return this.describeBindingEmitter.event;
    }

    dispose(): void {
        this.keyEmitter.dispose();
        this.zenModeEmitter.dispose();
        this.describeBindingEmitter.dispose();
    }
}
