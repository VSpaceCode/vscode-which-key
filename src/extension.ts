import { commands, ExtensionContext } from 'vscode';
import { toBindingItem } from './bindingItem';
import { Commands } from './constants';
import KeyListener from './keyListener';
import { StatusBar } from './statusBar';
import WhichKeyCommand from './whichKeyCommand';
import { defaultWhichKeyConfig, getFullSection, toWhichKeyConfig } from './whichKeyConfig';

const registered: Record<string, WhichKeyCommand> = {};
const keyListener = new KeyListener();
const statusBar = new StatusBar();

function registerWhichKeyCommand(args: any[]) {
    const config = toWhichKeyConfig(args);
    if (config) {
        const key = getFullSection(config.bindings);
        if (!(key in registered)) {
            registered[key] = new WhichKeyCommand(statusBar, keyListener);
        }

        registered[key].register(config);
    } else {
        console.warn('Incorrect which-key config format.');
    }
}

async function showWhichKey(args: any[]) {
    if (typeof args === 'string') {
        await registered[args].show();
    } else if (Array.isArray(args) && args.length > 0) {
        function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
            return value !== null && value !== undefined;
        }
        const bindings = args.map(toBindingItem).filter(notEmpty);
        await WhichKeyCommand.show(bindings, statusBar, keyListener);
    } else {
        const key = getFullSection(defaultWhichKeyConfig.bindings);
        if (!(key in registered)) {
            await commands.executeCommand(Commands.Register, defaultWhichKeyConfig);
        }
        await registered[key].show();
    }
}

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
    context.subscriptions.push(commands.registerCommand(Commands.Trigger, keyListener.trigger.bind(keyListener)));
    context.subscriptions.push(commands.registerCommand(Commands.Register, registerWhichKeyCommand));
    context.subscriptions.push(commands.registerCommand(Commands.Show, showWhichKey));
    context.subscriptions.push(commands.registerCommand(Commands.OpenFile, openFile));
}

export function deactivate() {
    for (const key of Object.keys(registered)) {
        registered[key].unregister();
    }
    keyListener.dispose();
}
