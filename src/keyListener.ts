import { EventEmitter } from "vscode";

export interface KeybindingArgs {
    key: string,
    when?: string,
}

export default class KeyListener {
    emitter: EventEmitter<KeybindingArgs>;
    constructor() {
        this.emitter = new EventEmitter<KeybindingArgs>();
    }

    trigger(key: string | KeybindingArgs) {
        if (typeof key === "string") {
            key = { key };
        }
        this.emitter.fire(key);
    }

    get onDidKeyPressed() {
        return this.emitter.event;
    }

    dispose() {
        this.emitter.dispose();
    }
}
