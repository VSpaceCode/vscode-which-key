export const extensionId = 'vscode-which-key';
export const publisherId = 'VSpaceCode';
export const contributePrefix = 'whichkey';
export enum ConfigKey {
	Delay = "delay",
	Bindings = "bindings",
	Overrides = "bindingOverrides",
}
export enum CommandKey {
	Show = 'show',
	Register = 'register',
	Trigger = 'triggerKey',
}

export enum ContextKey {
	Active = 'whichkeyActive'
}
export const whichKeyShow = `${contributePrefix}.${CommandKey.Show}`;
export const whichKeyRegister = `${contributePrefix}.${CommandKey.Register}`;
export const whichKeyTrigger = `${contributePrefix}.${CommandKey.Trigger}`;
