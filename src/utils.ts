import { commands, workspace } from "vscode";
import { CharCode } from "./charCode";

export const nameof = <T>(name: keyof T) => name;

export function setContext(key: string, value: any): Thenable<unknown> {
    return commands.executeCommand("setContext", key, value);
}

export function executeCommand(cmd: string, args: any): Thenable<unknown> {
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

export async function executeCommands(
    cmds: string[],
    args: any
): Promise<void> {
    for (let i = 0; i < cmds.length; i++) {
        const cmd = cmds[i];
        const arg = args?.[i];
        await executeCommand(cmd, arg);
    }
}

/**
 * Get workspace configuration
 * @param section The configuration name.
 */
export function getConfig<T>(section: string): T | undefined {
    // Get the minimal scope
    let filterSection: string | undefined = undefined;
    let lastSection: string = section;
    const idx = section.lastIndexOf(".");
    if (idx !== -1) {
        filterSection = section.substring(0, idx);
        lastSection = section.substring(idx + 1);
    }

    return workspace.getConfiguration(filterSection).get<T>(lastSection);
}

export function pipe<T>(...fns: Array<(arg: T) => T>) {
    return (x: T) => fns.reduce((v, f) => f(v), x);
}

// https://en.wikipedia.org/wiki/Halfwidth_and_Fullwidth_Forms_(Unicode_block)
export function toFullWidthKey(s: string): string {
    let key = "";
    for (const symbol of s) {
        const codePoint = symbol.codePointAt(0);
        if (
            codePoint &&
            codePoint >= CharCode.Exclamation &&
            codePoint <= CharCode.Tide
        ) {
            // Only replace single character string to full width
            // ASCII character into full width characters
            key += String.fromCodePoint(codePoint + 65248);
        } else if (codePoint === CharCode.Space) {
            // Full width space character
            key += "\u3000";
        } else {
            key += symbol;
        }
    }

    return key;
}

export function toSpecializedKey(s: string): string {
    let key = "";
    for (const symbol of s) {
        const codePoint = symbol.codePointAt(0);
        if (codePoint === CharCode.Space) {
            // Space
            key += "␣";
        } else if (codePoint === CharCode.Tab) {
            // tab
            key += "↹";
        } else {
            key += symbol;
        }
    }

    return key;
}

export const toFullWidthSpecializedKey = pipe(toSpecializedKey, toFullWidthKey);
