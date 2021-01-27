import { TransientBindingItem } from "../config/bindingItem";
import { IBaseWhichKeyMenuItem } from "./baseWhichKeyMenu";


export interface ITransientMenuItem extends TransientBindingItem, IBaseWhichKeyMenuItem {
}

export class TransientMenuItem implements ITransientMenuItem {
    private _binding: TransientBindingItem;
    constructor(binding: TransientBindingItem) {
        this._binding = binding;
    }

    get key() {
        return this._binding.key;
    }

    get name() {
        return this._binding.name;
    }

    get commands() {
        return this._binding.commands;
    }

    get args() {
        return this._binding.args;
    }

    get exit() {
        return this._binding.exit;
    }

    get label() {
        return this._binding.key;
    }

    get description() {
        return `\t${this._binding.name}`;
    }
}