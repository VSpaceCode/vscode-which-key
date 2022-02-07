export function wait(ms: number) {
    return new Promise<void>((r) => {
        setTimeout(() => {
            r();
        }, ms);
    });
}
