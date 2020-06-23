import { ConfigKey, contributePrefix } from "./constants";

export interface WhichKeyConfig {
    bindings: [string, string],
    overrides?: [string, string],
    title?: string,
}

export function toWhichKeyConfig(o: any) {
    if (typeof o === "object") {
        const config = o as Partial<WhichKeyConfig>;
        if ((config.bindings && config.bindings.length === 2) &&
            (!config.overrides || config.overrides.length === 2) &&
            (!config.title || typeof config.title === 'string')
        ) {
            return config as WhichKeyConfig;
        }
    }
    return undefined;
}

export function getFullSection(sections: [string, string]) {
    return `${sections[0]}.${sections[1]}`;
} 

export const defaultWhichKeyConfig: WhichKeyConfig = {
    bindings: [contributePrefix, ConfigKey.Bindings],
    overrides: [contributePrefix, ConfigKey.Overrides],
};