import { commands, ExtensionContext } from "vscode";
import { CommandRelay } from "./commandRelay";
import { Commands } from "./constants";
import { showTransientMenu } from "./menu/transientMenu";
import { StatusBar } from "./statusBar";
import { WhichKeyRegistry } from "./whichKeyRegistry";

async function openFile(): Promise<void> {
    try {
        await commands.executeCommand("workbench.action.files.openFile");
    } catch {
        // Mac only command
        // https://github.com/microsoft/vscode/issues/5437#issuecomment-211500871
        await commands.executeCommand("workbench.action.files.openFileFolder");
    }
}

export function activate(context: ExtensionContext): void {
    const statusBar = new StatusBar();
    const cmdRelay = new CommandRelay();
    const registry = new WhichKeyRegistry(statusBar, cmdRelay);

    context.subscriptions.push(
        commands.registerCommand(
            Commands.Trigger,
            cmdRelay.triggerKey,
            cmdRelay
        ),
        commands.registerCommand(Commands.UndoKey, cmdRelay.undoKey, cmdRelay),
        commands.registerCommand(
            Commands.Register,
            registry.register,
            registry
        ),
        commands.registerCommand(Commands.Show, registry.show, registry),
        commands.registerCommand(
            Commands.SearchBindings,
            cmdRelay.searchBindings,
            cmdRelay
        ),
        commands.registerCommand(
            Commands.ShowTransient,
            showTransientMenu.bind(registry, statusBar, cmdRelay)
        ),
        commands.registerCommand(
            Commands.RepeatRecent,
            registry.repeatRecent,
            registry
        ),
        commands.registerCommand(
            Commands.RepeatMostRecent,
            registry.repeatMostRecent,
            registry
        ),
        commands.registerCommand(
            Commands.ToggleZen,
            cmdRelay.toggleZenMode,
            cmdRelay
        ),
        commands.registerCommand(Commands.OpenFile, openFile)
    );

    context.subscriptions.push(registry, cmdRelay, statusBar);
}
