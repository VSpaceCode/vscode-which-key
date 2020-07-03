import { commands, ExtensionContext } from 'vscode';
import { toBindingItem } from './BindingItem';
import { whichKeyRegister, whichKeyShow, whichKeyTrigger } from './constants';
import KeyListener from './keyListener';
import WhichKeyCommand from './whichKeyCommand';
import { defaultWhichKeyConfig, getFullSection, toWhichKeyConfig } from './whichKeyConfig';

const registered: Record<string, WhichKeyCommand> = {};
const keyListener = new KeyListener();

export function activate(context: ExtensionContext) {
    context.subscriptions.push(commands.registerCommand(whichKeyTrigger, keyListener.trigger.bind(keyListener)));
    context.subscriptions.push(commands.registerCommand(whichKeyRegister, (args: any[]) => {
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
    }));
    context.subscriptions.push(commands.registerCommand(whichKeyShow, async (args: any[]) => {
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
    }));
}

export function deactivate() {
    Object.keys(registered).forEach(k => {
        registered[k].unregister();
    });
    keyListener.dispose();
}
