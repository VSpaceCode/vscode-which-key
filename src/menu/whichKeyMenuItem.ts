import { ActionType, BindingItem } from "../config/bindingItem";
import { Condition, evalCondition, getCondition } from "../config/condition";
import { specializeBindingKey } from "../utils";
import { BaseWhichKeyMenuItem } from "./baseWhichKeyMenu";

export class WhichKeyMenuItem implements BindingItem, BaseWhichKeyMenuItem {
    private _binding: BindingItem;
    private _cacheItems?: WhichKeyMenuItem[];

    public showIcons: boolean;

    constructor(binding: BindingItem, showIcons: boolean) {
        this._binding = binding;
        this.showIcons = showIcons;
    }

    get key(): string {
        return this._binding.key;
    }

    get name(): string {
        return this._binding.name;
    }

    get icon(): string | undefined {
        return this._binding.icon;
    }

    get type(): ActionType {
        return this._binding.type;
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

    get bindings(): WhichKeyMenuItem[] {
        if (this._binding.bindings && !this._cacheItems) {
            this._cacheItems = this._binding.bindings.map(b => new WhichKeyMenuItem(b, this.showIcons));
        }
        return this._cacheItems!;
    }

    get label(): string {
        return specializeBindingKey(this.key);
    }

    get description(): string {
        const icon = (this.showIcons && this.icon && this.icon.length > 0) ? `$(${this.icon})   ` : "";
        return `\t${icon}${this._binding.name}`;
    }

    evalCondition(condition?: Condition): WhichKeyMenuItem | undefined {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        let item: WhichKeyMenuItem | undefined = this;
        while (item && item.type === ActionType.Conditional) {
            // Search the condition first. If no matches, find the first empty condition as else
            item = item.findBinding(condition) ?? item.findBinding(undefined);
        }
        return item;
    }

    private findBinding(condition?: Condition): WhichKeyMenuItem | undefined {
        return this.bindings?.find(i => evalCondition(getCondition(i.key), condition));
    }
}