import { commands, ExtensionContext, window } from 'vscode';
import { toBindingItem } from './bindingItem';
import { whichKeyRegister, whichKeyShow, whichKeyTrigger } from './constants';
import KeyListener from './keyListener';
import WhichKeyCommand from './whichKeyCommand';
import { defaultWhichKeyConfig, getFullSection, toWhichKeyConfig } from './whichKeyConfig';

const registered: Record<string, WhichKeyCommand> = {};
const keyListener = new KeyListener();

function registerWhichKeyCommand(args: any[]) {
    const config = toWhichKeyConfig(args);
    if (config) {
        const key = getFullSection(config.bindings);
        if (!(key in registered)) {
            registered[key] = new WhichKeyCommand(keyListener);
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
        await WhichKeyCommand.show(bindings, keyListener);
    } else {
        const key = getFullSection(defaultWhichKeyConfig.bindings);
        if (!(key in registered)) {
            await commands.executeCommand(whichKeyRegister, defaultWhichKeyConfig);
        }
        await registered[key].show();
    }
}

function showWhichKeyCommand(args: any[]) {
    window.activeTextEditor?.document.languageId
    // Not awaiting to fix the issue where executing show key which can freeze vim
    showWhichKey(args).catch(e => window.showErrorMessage(e.toString()));
}

export function activate(context: ExtensionContext) {
    context.subscriptions.push(commands.registerCommand(whichKeyTrigger, keyListener.trigger.bind(keyListener)));
    context.subscriptions.push(commands.registerCommand(whichKeyRegister, registerWhichKeyCommand));
    context.subscriptions.push(commands.registerCommand(whichKeyShow, showWhichKeyCommand));
}

export function deactivate() {
    for (const key of Object.keys(registered)) {
        registered[key].unregister();
    }
    keyListener.dispose();
}
