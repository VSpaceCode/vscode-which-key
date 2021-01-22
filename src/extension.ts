import { commands, ExtensionContext } from 'vscode';
import { Commands } from './constants';
import KeyListener from './keyListener';
import { showTransientMenu } from './menu/transientMenu';
import { StatusBar } from './statusBar';
import { WhichKeyRegistry } from './whichKeyRegistry';


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
    const statusBar = new StatusBar();
    const keyListener = new KeyListener();
    const registry = new WhichKeyRegistry(statusBar, keyListener);

    context.subscriptions.push(
        commands.registerCommand(Commands.Trigger, keyListener.triggerKey, keyListener),
        commands.registerCommand(Commands.Register, registry.register, registry),
        commands.registerCommand(Commands.Show, registry.show, registry),
        commands.registerCommand(Commands.ShowBindings, registry.showBindings, registry),
        commands.registerCommand(Commands.ShowTransient, showTransientMenu.bind(registry, statusBar, keyListener)),
        commands.registerCommand(Commands.ToggleZen, keyListener.toggleZenMode, keyListener),
        commands.registerCommand(Commands.OpenFile, openFile),
    );

    context.subscriptions.push(registry, keyListener, statusBar);
}

export function deactivate() { }
