import { CharCode } from "./charCode";
import { ActionType, BindingItem } from "./config/bindingItem";
import { SortOrder } from "./constants";

function getType(b: BindingItem) {
    let type = b.type;
    if (b.bindings && type == ActionType.Conditional) {
        if (
            b.bindings.every((x) => b.bindings && x.type === b.bindings[0].type)
        ) {
            type = b.bindings[0].type;
        }
    }
    return type;
}

function getTypeOrder(type: ActionType) {
    return type === ActionType.Bindings
        ? 1
        : // non-bindings type have precedence
          0;
}

function getCustomKeyOrder(key: string) {
    // 1. Single Key (a, A, z, Z, etc)
    // 2. Function key (f11, F11, etc)
    // 3. Modifier key (C-z, etc)
    // 4. Others
    let functionKeyMatch;
    if (Array.from(key).length === 1) {
        return 0;
    } else if ((functionKeyMatch = key.match(/^[fF]([1-9][0-9]?)$/))) {
        // Function key
        //
        // Sort function key in place so it will order from F1 - F35 instead of F1, F11, F2.
        // Also assuming it won't have more than 100 function keys.
        return +functionKeyMatch[1];
    } else if (/.+-.+/g.test(key)) {
        // Modifier key
        return 100;
    } else {
        // Other
        return 101;
    }
}

/**
 * Create a custom to map to remap code point for sorting in the following order.
 *
 * 1. SPC
 * 2. Non-printable characters
 * 3. DEL
 * 4. ASCII symbols
 * 5. Number
 * 6. a-z
 * 5. A-Z
 * 6. Non-ASCII
 * @returns A custom map to remap code point for custom ordering.
 */
function createCustomCodePointMap() {
    let curMappedTo = 0;
    const map = new Map<number, number>();
    const add = (codes: [number, number]) => {
        const [from, to] = codes;
        for (let i = from; i <= to; i++) {
            map.set(i, curMappedTo++);
        }
    };
    const seq: [number, number][] = [
        [CharCode.Space, CharCode.Space],
        [CharCode.Null, CharCode.UnitSeparator],
        [CharCode.Delete, CharCode.Delete],
        [CharCode.Exclamation, CharCode.Slash],
        [CharCode.Colon, CharCode.At],
        [CharCode.LeftBracket, CharCode.Backtick],
        [CharCode.LeftBrace, CharCode.Tide],
        [CharCode.Zero, CharCode.Nine],
        [CharCode.a, CharCode.z],
        [CharCode.A, CharCode.Z],
    ];
    seq.forEach(add);

    return map;
}

/**
 * A cached custom code point map.
 */
let customCodePointMap: Map<number, number> | undefined = undefined;

/**
 * Get order for each character in the following order.
 *
 * 1. SPC
 * 2. Non-printable characters
 * 3. DEL
 * 4. ASCII symbols
 * 5. Number
 * 6. a-z
 * 5. A-Z
 * 6. Non-ASCII
 * @param {string} a A single character string
 * @returns A shifted code point for ordering
 */
function getCustomCodePointOrder(a: string) {
    const codePoint = a.codePointAt(0) ?? 0;
    customCodePointMap = customCodePointMap ?? createCustomCodePointMap();
    return customCodePointMap.get(codePoint) ?? codePoint;
}

function compareKeyString(
    codePointOrderFn: (s: string) => number,
    a: string,
    b: string
) {
    const aCodePoint = Array.from(a).map(codePointOrderFn);
    const bCodePoint = Array.from(b).map(codePointOrderFn);
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) {
        // Swap the case of the letter to sort lower case character first
        const diff = aCodePoint[i] - bCodePoint[i];
        if (diff !== 0) {
            return diff;
        }
    }

    return aCodePoint.length - bCodePoint.length;
}

/**
 * Custom comparer.
 *
 * This comparer sorts the bindings by its key in different "category" then by a custom order within each "category".
 *
 * The category order is as follows:
 * 1. Single Key (a, z, SPC, TAB, etc)
 * 2. Function key (f11, F11, etc)
 * 3. Modifier key (C-z, etc)
 * 4. Others
 *
 * For non function key, the sort order of each character of the key is as:
 * 1. SPC
 * 2. Non-printable characters
 * 3. DEL
 * 4. ASCII symbols
 * 5. Number
 * 6. a-z
 * 7. A-Z
 * 8. Non-ASCII
 *
 * For function key, the sort order is as follows:
 * F1, F2, ..., F11, F12, ..., F99
 */
export function customComparer(a: BindingItem, b: BindingItem) {
    const diff = getCustomKeyOrder(a.key) - getCustomKeyOrder(b.key);
    if (diff !== 0) {
        return diff;
    }
    return compareKeyString(getCustomCodePointOrder, a.key, b.key);
}

/**
 * Type then custom comparer.
 *
 * This comparer sorts bindings by their type then by custom comparer.
 */
export function typeThenCustomComparer(a: BindingItem, b: BindingItem) {
    const diff = getTypeOrder(getType(a)) - getTypeOrder(getType(b));
    if (diff !== 0) {
        return diff;
    }
    return customComparer(a, b);
}

/**
 * Alphabetical comparer.
 *
 * This comparer sorts bindings by their key alphabetically via `String.prototype.localeCompare()`.
 */
export function alphabeticalComparer(a: BindingItem, b: BindingItem) {
    return a.key.localeCompare(b.key);
}

/**
 * Non-number first comparer.
 *
 * This comparer sorts the bindings by its key in different "category" then by a {@link comparer} within each "category".
 *
 * The category order is as follows:
 * 1. Non-number key
 * 2. Number key
 */
export function nonNumberFirstComparer(
    comparer: (a: BindingItem, b: BindingItem) => number,
    a: BindingItem,
    b: BindingItem
) {
    const regex = /^[0-9]/;
    const aStartsWithNumber = regex.test(a.key);
    const bStartsWithNumber = regex.test(b.key);
    if (aStartsWithNumber !== bStartsWithNumber) {
        // Sort non-number first
        return aStartsWithNumber ? 1 : -1;
    } else {
        return comparer(a, b);
    }
}

export function getSortComparer(order: SortOrder) {
    switch (order) {
        case SortOrder.Custom:
            return customComparer;
        case SortOrder.CustomNonNumberFirst:
            // Keys with non-number alphabetically via custom comparer.
            return nonNumberFirstComparer.bind(null, customComparer);
        case SortOrder.TypeThenCustom:
            return typeThenCustomComparer;
        case SortOrder.Alphabetically:
            return alphabeticalComparer;
        case SortOrder.NonNumberFirst:
            // Keys with non-number alphabetically via `String.prototype.localeCompare()`.
            return nonNumberFirstComparer.bind(null, alphabeticalComparer);
        default:
            return undefined;
    }
}
