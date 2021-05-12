import { TransientBindingItem } from "../config/bindingItem";
import { BaseWhichKeyMenuItem } from "./baseWhichKeyMenu";

export class TransientMenuItem implements TransientBindingItem, BaseWhichKeyMenuItem {
    private _binding: TransientBindingItem;
    constructor(binding: TransientBindingItem) {
        this._binding = binding;
    }

    get key(): string {
        return this._binding.key;
    }

    get name(): string {
        return this._binding.name;
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
        return `\t${this._binding.name}`;
    }
}