import * as assert from "assert";
import { DispatchQueue } from "../../dispatchQueue";
import { wait } from "./testUtils";

suite(DispatchQueue.name, function () {
    test("can push and receive", async function () {
        const expected = 1;
        const actual = await new Promise((r) => {
            const queue = new DispatchQueue<number>(async (item: number) => {
                if (queue.length === 0) {
                    r(item);
                }
            });
            queue.push(expected);
        });

        assert.strictEqual(actual, expected);
    });

    test("can queue up while one is processing", async function () {
        const actual: number[] = [];
        const lengths: number[] = [];
        await new Promise<void>((r) => {
            const queue = new DispatchQueue<number>(async (item: number) => {
                await wait(100);
                lengths.push(queue.length);
                actual.push(item);
                if (item === 3) {
                    r();
                }
            });
            queue.push(1);
            queue.push(2);
            queue.push(3);
        });

        assert.deepStrictEqual(actual, [1, 2, 3]);
        assert.deepStrictEqual(lengths, [2, 1, 0]);
    });
});
