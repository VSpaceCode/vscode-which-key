import { BindingItem, toCommands } from "./config/bindingItem";
import { CommandRelay } from "./commandRelay";
import { Commands } from "./constants";
import { RepeaterMenuItem, showRepeaterMenu } from "./menu/repeaterMenu";
import { WhichKeyMenuItem } from "./menu/whichKeyMenuItem";
import { StatusBar } from "./statusBar";
import { executeCommands } from "./utils";

function shouldIgnore(item: BindingItem): boolean {
    const cmds = toCommands(item).commands;
    const ignore = [Commands.RepeatRecent, Commands.RepeatMostRecent];
    return cmds.findIndex(ignore.includes.bind(ignore)) >= 0;
}

class WhichKeyRepeaterEntry {
    private path: WhichKeyMenuItem[];

    constructor(path: WhichKeyMenuItem[]) {
        this.path = [...path];
    }

    get pathKey(): string {
        return this.path.map(p => p.key).toString();
    }

    get item(): WhichKeyMenuItem {
        return this.path[this.path.length - 1];
    }

    get uiPath(): string {
        return this.path.slice(0, -1).map(p => p.name).join("$(chevron-right)");
    }

    get shouldIgnore(): boolean {
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

    public constructor(private statusBar: StatusBar, private cmdRelay: CommandRelay) {
        this.cache = [];
    }

    private get isEmpty(): boolean {
        return this.cache.length === 0;
    }

    private get length(): number {
        return this.cache.length;
    }

    public record(path: WhichKeyMenuItem[]): void {
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

    public async repeatLastAction(idx = 0): Promise<void> {
        if (!this.isEmpty && idx >= 0 && idx < this.length) {
            const entry = this.cache.splice(idx, 1)[0];
            const { commands, args } = toCommands(entry.item);
            await executeCommands(commands, args);
            this.cache.unshift(entry);
        } else {
            this.statusBar.setErrorMessage("No last action");
        }
    }

    private repeatAction(pathKey: string): Promise<void> {
        const idx = this.cache.findIndex(c => c.pathKey === pathKey);
        return this.repeatLastAction(idx);
    }

    public show(): Promise<void> {
        return showRepeaterMenu(this.statusBar, this.cmdRelay, this.createMenuItems(), "Repeat previous actions");
    }

    public clear(): void {
        this.cache.length = 0;
    }

    private createMenuItems(): RepeaterMenuItem[] {
        return this.cache.map((entry, index) => {
            const key = index + 1;
            const menuItem: RepeaterMenuItem = {
                key: key.toString(),
                name: entry.item.name,
                label: key.toString(),
                description: entry.item.name,
                detail: entry.uiPath,
                accept: this.repeatAction.bind(this, entry.pathKey),
            };
            return menuItem;
        });
    }
}
