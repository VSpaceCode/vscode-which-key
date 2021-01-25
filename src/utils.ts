import { commands } from "vscode";

export function setContext(key: string, value: any) {
    return commands.executeCommand("setContext", key, value);
}

export function executeCommand(cmd: string, args: any) {
    if (Array.isArray(args)) {
        const arr = args as any[];
        return commands.executeCommand(cmd, ...arr);
    } else if (args) {
        // undefined from the object chainning/indexing or
        // null from the json deserialization
        return commands.executeCommand(cmd, args);
    } else {
        return commands.executeCommand(cmd);
    }
}

export async function executeCommands(cmds: string[], args: any) {
    for (let i = 0; i < cmds.length; i++) {
        const cmd = cmds[i];
        const arg = args?.[i];
        await executeCommand(cmd, arg);
    }
}

// https://en.wikipedia.org/wiki/Halfwidth_and_Fullwidth_Forms_(Unicode_block)
export function toFullWidthKey(s: string) {
    let key = "";
    for (const symbol of s) {
        const codePoint = symbol.codePointAt(0);
        if (s.length === 1 && codePoint && codePoint >= 33 && codePoint <= 126) {
            // Only replace single character string to full width
            // ASCII character into full width characters
            key += String.fromCodePoint(codePoint + 65248);
        } else if (codePoint === 32) {
            // Space
            key += '␣';
        } else if (codePoint === 9) {
            // tab
            key += '↹';
        } else {
            key += symbol;
        }
    }

    return key;
}

export function specializeBindingKey(s: string) {
    let key = "";
    for (const symbol of s) {
        const codePoint = symbol.codePointAt(0);
        if (codePoint === 32) {
            // Space
            key += '␣';
        } else if (codePoint === 9) {
            // tab
            key += '↹';
        } else {
            key += symbol;
        }
    }

    return key;
}