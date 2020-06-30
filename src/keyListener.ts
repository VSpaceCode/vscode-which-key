import { EventEmitter } from "vscode";

export default class KeyListener {
    emitter: EventEmitter<string>;
    constructor() {
        this.emitter = new EventEmitter<string>();
    }

    trigger(key: string) {
        this.emitter.fire(key);
    }

    get onDidKeyPressed() {
        return this.emitter.event;
    }

    dispose() {
        this.emitter.dispose();
    }
}
