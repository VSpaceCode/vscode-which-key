import { commands, Disposable } from "vscode";
import { CommandRelay } from "../../../commandRelay";
import { ActionType, DisplayOption } from "../../../config/bindingItem";
import { WhichKeyMenuConfig } from "../../../config/menuConfig";
import { showWhichKeyMenu } from "../../../menu/whichKeyMenu";
import { StatusBar } from "../../../statusBar";

suite("WhichKeyMenu", function () {
    let disposables: Disposable[] = [];

    this.beforeEach(() => {
        disposables = [];
    });

    this.afterEach(() => {
        for (const d of disposables) {
            d.dispose();
        }
    });

    test("can trigger keys right after show executes", function (done) {
        const statusBar = new StatusBar();
        const cmdRelay = new CommandRelay();
        const config: WhichKeyMenuConfig = {
            delay: 0,
            showIcons: false,
            showButtons: false,
            useFullWidthCharacters: false,
            title: "Test",
            bindings: [
                {
                    key: "m",
                    name: "+Major",
                    type: ActionType.Bindings,
                    bindings: [
                        {
                            key: "x",
                            name: "test command",
                            type: ActionType.Command,
                            command: "whichkey.testCommand",
                        },
                    ],
                },
            ],
        };
        disposables = [
            statusBar,
            cmdRelay,
            commands.registerCommand("whichkey.testCommand", () => {
                done();
            }),
        ];

        showWhichKeyMenu(statusBar, cmdRelay, undefined, config);
        cmdRelay.triggerKey("m");
        cmdRelay.triggerKey("x");
    });

    test("can hide item with `display: hidden`", function (done) {
        const statusBar = new StatusBar();
        const cmdRelay = new CommandRelay();
        const config: WhichKeyMenuConfig = {
            delay: 0,
            showIcons: false,
            showButtons: false,
            useFullWidthCharacters: false,
            title: "Test",
            bindings: [
                {
                    key: "a",
                    name: "Should be hidden",
                    type: ActionType.Command,
                    display: DisplayOption.Hidden,
                    command: "whichkey.hiddenCommand",
                },
                {
                    key: "x",
                    name: "test command",
                    type: ActionType.Command,
                    command: "whichkey.testCommand",
                },
            ],
        };
        disposables = [
            statusBar,
            cmdRelay,
            commands.registerCommand("whichkey.testCommand", () => {
                done();
            }),
            commands.registerCommand("whichkey.hiddenCommand", () => {
                done("The item should be hidden");
            }),
        ];

        showWhichKeyMenu(statusBar, cmdRelay, undefined, config);
        // Wait until the UI is shown
        setTimeout(() => {
            commands.executeCommand(
                "workbench.action.acceptSelectedQuickOpenItem"
            );
        }, 100);
    });
});
