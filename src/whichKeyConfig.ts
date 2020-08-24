import { ConfigKey, contributePrefix } from "./constants";

type ConfigSections = [string, string];

export interface WhichKeyConfig {
    bindings: ConfigSections,
    overrides?: ConfigSections,
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

export function getFullSection(sections: ConfigSections) {
    return `${sections[0]}.${sections[1]}`;
} 

export const defaultWhichKeyConfig: WhichKeyConfig = {
    bindings: [contributePrefix, ConfigKey.Bindings],
    overrides: [contributePrefix, ConfigKey.Overrides],
};