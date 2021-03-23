import { Configs } from "../constants";

type ConfigSections = [string, string];
export interface OldWhichKeyConfig {
    bindings: ConfigSections;
    overrides?: ConfigSections;
    title?: string;
}

export interface WhichKeyConfig {
    bindings: string;
    overrides?: string;
    title?: string;
}

function isString(x: any): x is string {
    return typeof x === "string";
}

function isConfigSections(x: any): x is ConfigSections {
    return x && Array.isArray(x) && x.length === 2 && isString(x[0]) && isString(x[1]);
}

function isOldWhichKeyConfig(config: any): config is OldWhichKeyConfig {
    return (config.bindings && isConfigSections(config.bindings)) &&
        (!config.overrides || isConfigSections(config.overrides)) &&
        (!config.title || isString(config.title));
}

function isWhichKeyConfig(config: any): boolean {
    return (config.bindings && isString(config.bindings)) &&
        (!config.overrides || isString(config.overrides)) &&
        (!config.title || isString(config.title));
}

function getFullSection(sections: ConfigSections): string {
    return `${sections[0]}.${sections[1]}`;
}

function convertOldWhichKeyConfig(o: OldWhichKeyConfig): WhichKeyConfig {
    const config: WhichKeyConfig = {
        bindings: getFullSection(o.bindings),
        title: o.title
    };
    if (o.overrides) {
        config.overrides = getFullSection(o.overrides);
    }
    return config;
}

export function toWhichKeyConfig(o: any): WhichKeyConfig | undefined {
    if (typeof o === "object") {
        if (isOldWhichKeyConfig(o)) {
            return convertOldWhichKeyConfig(o);
        }
        if (isWhichKeyConfig(o)) {
            return o;
        }
    }
    return undefined;
}

export const defaultWhichKeyConfig: WhichKeyConfig = {
    bindings: Configs.Bindings,
    overrides: Configs.Overrides
};
