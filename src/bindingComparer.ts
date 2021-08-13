import { CharCode } from "./charCode";
import { ActionType, BindingItem } from "./config/bindingItem";
import { SortOrder } from "./constants";

function getType(b: BindingItem) {
	let type = b.type;
	if (b.bindings && type == ActionType.Conditional) {
		if (b.bindings.every(x => b.bindings && x.type === b.bindings[0].type)) {
			type = b.bindings[0].type;
		}
	}
	return type;
}

function getTypeOrder(type: ActionType) {
	if (type === ActionType.Bindings) {
		return 1;
	}

	// non-bindings type have precedence
	return 0;
}

function getKeyTypeOrder(b: BindingItem) {
	// 1. Single key
	// 2. Normal
	// 3. Combo key with dash like C-v

	// Use array from to handle unicode correctly
	const len = Array.from(b.key).length;
	if (len === 1) {
		return 0;
	} else if (/.+-.+/g.test(b.key)) {
		return 3;
	} else {
		return 2;
	}
}

/**
 * Get order for each character
 * 1. Swap SPACE and TAB so SPACE key order first
 * 2. Shift capital character to the end of ASCII (before)
 * @param {string} a A single character string
 * @returns a shifted character for ordering
 */
function codePointOrder(a: string) {
	let codePoint = a.codePointAt(0) ?? 0;

	if (codePoint >= CharCode.A && codePoint <= CharCode.Z) {
		// shift A-Z back to the end of ASCII set
		codePoint += (CharCode.Tide - CharCode.LeftBracket + 1);
	} else if (codePoint >= CharCode.LeftBracket && codePoint <= CharCode.Tide) {
		// shift ] - ~ forward
		codePoint -= (CharCode.Z - CharCode.A + 1);
	} else if (codePoint === CharCode.Space) {
		// Swap SPACE to TAB
		codePoint = CharCode.Tab;
	} else if (codePoint === CharCode.Tab) {
		// Swap TAB to SPACE
		codePoint = CharCode.Space;
	}
	return codePoint;
}

function compareKeyString(a: string, b: string) {
	const aCodePoint = Array.from(a).map(codePointOrder);
	const bCodePoint = Array.from(b).map(codePointOrder);
	const len = Math.min(a.length, b.length);
	for (let i = 0; i < len; i++) {
		// Swap the case of the letter to sort lower case character first
		const diff = aCodePoint[i] - bCodePoint[i];
		if (diff !== 0) { return diff; }
	}

	return aCodePoint.length - bCodePoint.length;
}

/**
 * Default binding comparer
 * 
 * The sorting order is as follows:
 * 1. Binding type (non-binding fist)
 * 2. Key type (single key first)
 * 3. Key value base on a custom sort map
 */
export function defaultComparer(a: BindingItem, b: BindingItem) {
	let diff = getTypeOrder(getType(a)) - getTypeOrder(getType(b));
	if (diff !== 0) { return diff; }

	diff = getKeyTypeOrder(a) - getKeyTypeOrder(b);
	if (diff !== 0) { return diff; }

	diff = compareKeyString(a.key, b.key);
	return diff;
}

export function alphabeticalComparer(a: BindingItem, b: BindingItem) {
	return a.key.localeCompare(b.key);
}

export function nonNumberFirstComparer(a: BindingItem, b: BindingItem) {
	const regex = /^[0-9]/;
	const aStartsWithNumber = regex.test(a.key);
	const bStartsWithNumber = regex.test(b.key);
	if (aStartsWithNumber !== bStartsWithNumber) {
		// Sort non-number first
		return aStartsWithNumber ? 1 : -1;
	} else {
		return a.key.localeCompare(b.key);
	}
}

export function getSortComparer(order: SortOrder) {
    switch (order) {
        case SortOrder.Default:
            return defaultComparer;
        case SortOrder.Alphabetically:
            return alphabeticalComparer;
        case SortOrder.NonNumberFirst:
            return nonNumberFirstComparer;
        default:
            return undefined;
    }
}
