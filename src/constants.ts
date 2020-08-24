export const extensionId = 'vscode-which-key';
export const publisherId = 'VSpaceCode';
export const contributePrefix = 'whichkey';
export enum ConfigKey {
	Delay = "delay",
	SortOrder = "sortOrder",
	Bindings = "bindings",
	Overrides = "bindingOverrides",
}
export enum CommandKey {
	Show = 'show',
	Register = 'register',
	Trigger = 'triggerKey',
}

export enum SortOrder {
	None = 'none',
	Alphabetically = 'alphabetically',
	NonNumberFirst = 'nonNumberFirst',
}

export enum ContextKey {
	Active = 'whichkeyActive',
	Visible = 'whichkeyVisible'
}
export const whichKeyShow = `${contributePrefix}.${CommandKey.Show}`;
export const whichKeyRegister = `${contributePrefix}.${CommandKey.Register}`;
export const whichKeyTrigger = `${contributePrefix}.${CommandKey.Trigger}`;
