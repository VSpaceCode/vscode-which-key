export const extensionId = 'vscode-which-key';
export const publisherId = 'VSpaceCode';
export const contributePrefix = 'whichkey';
export enum ConfigKey {
	Bindings = "bindings",
	Overrides = "bindingOverrides",
}
export enum CommandKey {
	Show = 'show',
	Register = 'register',
	Trigger = 'triggerKey',
}
export const whichKeyShow = `${contributePrefix}.${CommandKey.Show}`;
export const whichKeyRegister = `${contributePrefix}.${CommandKey.Register}`;
export const whichKeyTab = `${contributePrefix}.${CommandKey.Trigger}`;