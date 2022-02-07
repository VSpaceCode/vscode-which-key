export interface Condition {
    when?: string;
    languageId?: string;
}

export function getCondition(key?: string): Condition | undefined {
    if (key && key.length > 0) {
        const props = key.split(";");
        const r = props.reduce((result, prop) => {
            const [key, value] = prop.split(":");
            result[key] = value;
            return result;
        }, {} as Record<string, string>);

        // Check to make sure at least the one property so we don't create
        // { when: undefined, languagedId: undefined }
        if ("when" in r || "languageId" in r) {
            return {
                when: r["when"],
                languageId: r["languageId"],
            };
        }
    }
    return undefined;
}

export function evalCondition(
    stored?: Condition,
    evaluatee?: Condition
): boolean {
    if (evaluatee && stored) {
        let result = true;
        if (stored.when) {
            result = result && stored.when === evaluatee.when;
        }
        if (stored.languageId) {
            result = result && stored.languageId === evaluatee.languageId;
        }
        return result;
    }
    // For if they are both undefined or null
    return stored === evaluatee;
}

export function isConditionEqual(
    condition1?: Condition,
    condition2?: Condition
): boolean {
    if (condition1 && condition2) {
        let result = true;
        result = result && condition1.when === condition2.when;
        result = result && condition1.languageId === condition2.languageId;
        return result;
    }
    // For if they are both undefined or null
    return condition1 === condition2;
}

export function isConditionKeyEqual(key1?: string, key2?: string): boolean {
    return isConditionEqual(getCondition(key1), getCondition(key2));
}
