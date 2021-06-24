import { TransientBindingItem } from "../config/bindingItem";
import { BaseWhichKeyMenuItem } from "./baseWhichKeyMenu";

export class TransientMenuItem implements TransientBindingItem, BaseWhichKeyMenuItem {
    private _binding: TransientBindingItem;

    public showIcons: boolean;

    constructor(binding: TransientBindingItem, showIcons: boolean) {
        this._binding = binding;
        this.showIcons = showIcons;
    }

    get key(): string {
        return this._binding.key;
    }

    get name(): string {
        return this._binding.name;
    }

    get icon(): string | undefined{
        return this._binding.icon;
    }

    get command(): string | undefined {
        return this._binding.command;
    }

    get commands(): string[] | undefined {
        return this._binding.commands;
    }

    get args(): any {
        return this._binding.args;
    }

    get exit(): boolean | undefined {
        return this._binding.exit;
    }

    get label(): string {
        return this._binding.key;
    }

    get description(): string {
        const icon = (this.showIcons && this.icon && this.icon.length > 0) ? `$(${this.icon})   ` : "";
        return `\t${icon}${this._binding.name}`;
    }
}