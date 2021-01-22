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
	ShowBindings = 'showBindings',
	ShowTransient = 'showTransient',
	OpenFile = 'openFile',
}

export enum SortOrder {
	None = 'none',
	Alphabetically = 'alphabetically',
	NonNumberFirst = 'nonNumberFirst',
}

export enum ContextKey {
	Active = 'whichkeyActive',
	Visible = 'whichkeyVisible',
	TransientVisible = 'transientVisible'
}

export const Configs = {
	Delay: `${contributePrefix}.${ConfigKey.Delay}`,
	SortOrder: `${contributePrefix}.${ConfigKey.SortOrder}`,
	Bindings: `${contributePrefix}.${ConfigKey.Bindings}`,
	Overrides: `${contributePrefix}.${ConfigKey.Overrides}`,
};

export const Commands = {
	Show: `${contributePrefix}.${CommandKey.Show}`,
	Register: `${contributePrefix}.${CommandKey.Register}`,
	Trigger: `${contributePrefix}.${CommandKey.Trigger}`,
	ShowBindings: `${contributePrefix}.${CommandKey.ShowBindings}`,
	ShowTransient: `${contributePrefix}.${CommandKey.ShowTransient}`,
	OpenFile: `${contributePrefix}.${CommandKey.OpenFile}`,
};
