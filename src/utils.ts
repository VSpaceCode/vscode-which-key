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

export function specializeBindingKey(s: string) {
    return s.replace(/ /g, '␣').replace(/\t/g, '↹');
}