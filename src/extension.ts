import { commands, ExtensionContext } from 'vscode';
import { Commands } from './constants';
import KeyListener from './keyListener';
import { StatusBar } from './statusBar';
import { WhichKeyRegistry } from './whichKeyRegistry';

const statusBar = new StatusBar();
const keyListener = new KeyListener();
const registry = new WhichKeyRegistry(statusBar, keyListener);

async function openFile() {
    try {
        await commands.executeCommand("workbench.action.files.openFile");
    } catch {
        // Mac only command
        // https://github.com/microsoft/vscode/issues/5437#issuecomment-211500871
        await commands.executeCommand("workbench.action.files.openFileFolder");
    }
}

export function activate(context: ExtensionContext) {
    context.subscriptions.push(commands.registerCommand(Commands.Trigger, keyListener.trigger, keyListener));
    context.subscriptions.push(commands.registerCommand(Commands.Register, registry.register, registry));
    context.subscriptions.push(commands.registerCommand(Commands.Show, registry.show, registry));
    context.subscriptions.push(commands.registerCommand(Commands.ShowBindings, registry.showBindings, registry));
    context.subscriptions.push(commands.registerCommand(Commands.OpenFile, openFile));
}

export function deactivate() {
    registry.dispose();
    keyListener.dispose();
    statusBar.dispose();
}
