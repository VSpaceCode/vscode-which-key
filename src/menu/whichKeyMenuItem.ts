import { ActionType, BindingItem } from "../config/bindingItem";
import { Condition, evalCondition, getCondition } from "../config/condition";
import { specializeBindingKey } from "../utils";
import { IBaseWhichKeyMenuItem } from "./baseWhichKeyMenu";

export interface IWhichKeyMenuItem extends BindingItem, IBaseWhichKeyMenuItem {
}

export class WhichKeyMenuItem implements IWhichKeyMenuItem {
    private _binding: BindingItem;
    private _cacheItems?: WhichKeyMenuItem[];

    constructor(binding: BindingItem) {
        this._binding = binding;
    }

    get key() {
        return this._binding.key;
    }

    get name() {
        return this._binding.name;
    }

    get type() {
        return this._binding.type;
    }

    get command() {
        return this._binding.command;
    }

    get commands() {
        return this._binding.commands;
    }

    get args() {
        return this._binding.args;
    }

    get bindings() {
        if (this._binding.bindings && !this._cacheItems) {
            this._cacheItems = this._binding.bindings.map(b => new WhichKeyMenuItem(b));
        }
        return this._cacheItems;
    }

    get label() {
        return specializeBindingKey(this.key);
    }

    get description() {
        return `\t${this._binding.name}`;
    }

    evalCondition(condition?: Condition) {
        switch (this.type) {
            case ActionType.Conditional:
                // Search the condition first. If no matches, find the first empty condition as else
                return this.findBinding(condition) ?? this.findBinding(undefined);
            default:
                return this;

        }
    }

    private findBinding(condition?: Condition) {
        return this.bindings?.find(i => evalCondition(getCondition(i.key), condition));
    }
}