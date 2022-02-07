import { Configs } from "../constants";

type ConfigSections = [string, string];

export interface WhichKeyConfig {
    bindings: string;
    overrides?: string;
    title?: string;
}

function isString(x: any): x is string {
    return typeof x === "string";
}

function isConfigSections(x: any): x is ConfigSections {
    return (
        x &&
        Array.isArray(x) &&
        x.length === 2 &&
        isString(x[0]) &&
        isString(x[1])
    );
}

function isWhichKeyConfig(config: any): config is WhichKeyConfig {
    return (
        config.bindings &&
        isString(config.bindings) &&
        (!config.overrides || isString(config.overrides)) &&
        (!config.title || isString(config.title))
    );
}

function getFullSection(sections: ConfigSections): string {
    return `${sections[0]}.${sections[1]}`;
}

export function toWhichKeyConfig(o: any): WhichKeyConfig | undefined {
    if (typeof o === "object") {
        if (o.bindings && isConfigSections(o.bindings)) {
            o.bindings = getFullSection(o.bindings);
        }
        if (o.overrides && isConfigSections(o.overrides)) {
            o.overrides = getFullSection(o.overrides);
        }
        if (isWhichKeyConfig(o)) {
            return o;
        }
    }
    return undefined;
}

export const defaultWhichKeyConfig: WhichKeyConfig = {
    bindings: Configs.Bindings,
    overrides: Configs.Overrides,
};
