export const extensionId = 'VSpaceCode.whichkey';
export const contributePrefix = 'whichkey';
export enum ConfigKey {
	Delay = 'delay',
	ShowIcons = 'showIcons',
	SortOrder = 'sortOrder',
	Bindings = 'bindings',
	Overrides = 'bindingOverrides',
}
export enum CommandKey {
	Show = 'show',
	Register = 'register',
	Trigger = 'triggerKey',
	SearchBindings = 'searchBindings',
	ShowTransient = 'showTransient',
	RepeatRecent = 'repeatRecent',
	RepeatMostRecent = 'repeatMostRecent',
	ToggleZenMode = 'toggleZenMode',
	OpenFile = 'openFile',
}

export enum SortOrderItem {
	None = 'none',
	Alphabetically = 'alphabetically',
	NonNumberFirst = 'nonNumberFirst',
	LowercaseFirst = 'lowercaseFirst',
}

export enum ContextKey {
	Active = 'whichkeyActive',
	Visible = 'whichkeyVisible',
	TransientVisible = 'transientVisible',
}

export const Configs = {
	Delay: `${contributePrefix}.${ConfigKey.Delay}`,
	ShowIcons: `${contributePrefix}.${ConfigKey.ShowIcons}`,
	SortOrder: `${contributePrefix}.${ConfigKey.SortOrder}`,
	Bindings: `${contributePrefix}.${ConfigKey.Bindings}`,
	Overrides: `${contributePrefix}.${ConfigKey.Overrides}`,
};

export const Commands = {
	Show: `${contributePrefix}.${CommandKey.Show}`,
	Register: `${contributePrefix}.${CommandKey.Register}`,
	Trigger: `${contributePrefix}.${CommandKey.Trigger}`,
	SearchBindings: `${contributePrefix}.${CommandKey.SearchBindings}`,
	ShowTransient: `${contributePrefix}.${CommandKey.ShowTransient}`,
	RepeatRecent: `${contributePrefix}.${CommandKey.RepeatRecent}`,
	RepeatMostRecent: `${contributePrefix}.${CommandKey.RepeatMostRecent}`,
	ToggleZen: `${contributePrefix}.${CommandKey.ToggleZenMode}`,
	OpenFile: `${contributePrefix}.${CommandKey.OpenFile}`,
};
