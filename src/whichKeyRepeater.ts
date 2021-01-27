import { BindingItem, toCommands } from "./config/bindingItem";
import { CommandRelay } from "./commandRelay";
import { Commands } from "./constants";
import { IRepeaterMenuItem, showRepeaterMenu } from "./menu/repeaterMenu";
import { IWhichKeyMenuItem } from "./menu/whichKeyMenuItem";
import { IStatusBar } from "./statusBar";
import { executeCommands } from "./utils";

class WhichKeyRepeaterEntry {
    private path: IWhichKeyMenuItem[];

    constructor(path: IWhichKeyMenuItem[]) {
        this.path = [...path];
    }

    get pathKey() {
        return this.path.map(p => p.key).toString();
    }

    get item() {
        return this.path[this.path.length - 1];
    }

    get description() {
        return this.path.map(p => p.name).join("$(chevron-right)");
    }

    get shouldIgnore() {
        return this.path.length === 0 || shouldIgnore(this.item);
    }
}

export class WhichKeyRepeater {
    /**
     * The max number we can store is the number of single digit key we can press for whichkey menu.
     */
    private static MaxSize = 9;
    /**
     * LRU cache; however our MAX_SIZE is so small that a list should suffice.
     */
    private cache: WhichKeyRepeaterEntry[];

    public constructor(private statusBar: IStatusBar, private cmdRelay: CommandRelay) {
        this.cache = [];
    }

    private get isEmpty() {
        return this.cache.length === 0;
    }

    private get length() {
        return this.cache.length;
    }

    public record(path: IWhichKeyMenuItem[]) {
        const newEntry = new WhichKeyRepeaterEntry(path);
        if (newEntry.shouldIgnore) {
            return;
        }

        const pathKey = newEntry.pathKey;
        const idx = this.cache.findIndex(c => c.pathKey === pathKey);
        if (idx >= 0) {
            // If found, remove element
            this.cache.splice(idx, 1);
        }

        this.cache.unshift(newEntry);

        if (this.cache.length > WhichKeyRepeater.MaxSize) {
            this.cache.pop();
        }
    }

    public async repeatLastAction(idx: number = 0) {
        if (!this.isEmpty && idx >= 0 && idx < this.length) {
            const entry = this.cache.splice(idx, 1)[0];
            const { commands, args } = toCommands(entry.item);
            await executeCommands(commands, args);
            this.cache.unshift(entry);
        }
        this.statusBar.setErrorMessage("No last action");
    }

    private repeatAction(pathKey: string) {
        const idx = this.cache.findIndex(c => c.pathKey === pathKey);
        return this.repeatLastAction(idx);
    }

    public show() {
        return showRepeaterMenu(this.statusBar, this.cmdRelay, this.createMenuItems(), "Repeat previous actions");
    }

    public clear() {
        this.cache.length = 0;
    }

    private createMenuItems() {
        return this.cache.map((entry, index) => {
            const key = index + 1;
            const menuItem: IRepeaterMenuItem = {
                key: key.toString(),
                name: entry.item.name,
                label: key.toString(),
                description: entry.item.name,
                detail: entry.description,
                accept: this.repeatAction.bind(this, entry.pathKey),
            };
            return menuItem;
        });
    }
}

function shouldIgnore(item: BindingItem) {
    const cmds = toCommands(item).commands;
    const ignore = [Commands.ShowPreviousActions, Commands.RepeatLastAction];
    return cmds.findIndex(ignore.includes.bind(ignore)) >= 0;
}