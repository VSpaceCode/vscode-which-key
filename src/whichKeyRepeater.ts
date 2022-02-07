import { CommandRelay } from "./commandRelay";
import { BindingItem, toCommands } from "./config/bindingItem";
import { Commands, Configs } from "./constants";
import { RepeaterMenuItem, showRepeaterMenu } from "./menu/repeaterMenu";
import { StatusBar } from "./statusBar";
import { executeCommands, getConfig } from "./utils";

function shouldIgnore(item: BindingItem): boolean {
    const cmds = toCommands(item).commands;
    const ignore = [Commands.RepeatRecent, Commands.RepeatMostRecent];
    return cmds.findIndex(ignore.includes.bind(ignore)) >= 0;
}

class WhichKeyRepeaterEntry {
    private path: BindingItem[];

    constructor(path: BindingItem[]) {
        this.path = [...path];
    }

    get item(): BindingItem {
        return this.path[this.path.length - 1];
    }

    get pathKey(): string {
        return this.path.map((p) => p.key).toString();
    }

    get basePathNames(): string[] {
        return this.path.slice(0, -1).map((p) => p.name);
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

    public constructor(
        private statusBar: StatusBar,
        private cmdRelay: CommandRelay
    ) {
        this.cache = [];
    }

    private get isEmpty(): boolean {
        return this.cache.length === 0;
    }

    private get length(): number {
        return this.cache.length;
    }

    public record(path: BindingItem[]): void {
        const newEntry = new WhichKeyRepeaterEntry(path);
        if (newEntry.shouldIgnore) {
            return;
        }

        const pathKey = newEntry.pathKey;
        const idx = this.cache.findIndex((c) => c.pathKey === pathKey);
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
        const idx = this.cache.findIndex((c) => c.pathKey === pathKey);
        return this.repeatLastAction(idx);
    }

    public show(): Promise<void> {
        const config = {
            title: "Repeat previous actions",
            items: this.createMenuItems(),
            useFullWidthCharacters:
                getConfig<boolean>(Configs.UseFullWidthCharacters) ?? false,
        };
        return showRepeaterMenu(this.statusBar, this.cmdRelay, config);
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
                basePathNames: entry.basePathNames,
                accept: this.repeatAction.bind(this, entry.pathKey),
            };
            return menuItem;
        });
    }
}
