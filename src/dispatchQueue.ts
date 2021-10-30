export class DispatchQueue<T> {
    private _queue: T[];
    private _isProcessing;
    private _receiver: (item: T) => Promise<void>;

    constructor(receiver: (item: T) => Promise<void>) {
        this._queue = [];
        this._isProcessing = false;
        this._receiver = receiver;
    }

    get length() {
        return this._queue.length;
    }

    push(item: T) {
        this._queue.push(item);
        this._receive();
    }

    clear() {
        this._queue.length = 0;
    }

    private async _receive() {
        if (this._isProcessing) {
            // Skip if one is already executing.
            return;
        }

        this._isProcessing = true;
        let item;
        while ((item = this._queue.shift())) {
            await this._receiver(item);
        }
        this._isProcessing = false;
    }
}
