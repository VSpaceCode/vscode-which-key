export const extensionId = 'VSpaceCode.whichkey';
export const contributePrefix = 'whichkey';
export enum ConfigKey {
	Delay = "delay",
	ShowIcons = "showIcons",
	SortOrder = "sortOrder",
	Bindings = "bindings",
	Overrides = "bindingOverrides",
}
export enum CommandKey {
	Register = 'register',
	RegisterLayer = 'registerLayer',
	Show = 'show',
	ShowLayer = 'showLayer',
	ShowTransient = 'showTransient',
	Trigger = 'triggerKey',
	SearchBindings = 'searchBindings',
	RepeatRecent = 'repeatRecent',
	RepeatMostRecent = 'repeatMostRecent',
	ToggleZenMode = 'toggleZenMode',
	OpenFile = 'openFile',
}

export enum SortOrder {
	Default = 'default',
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
	ShowIcons: `${contributePrefix}.${ConfigKey.ShowIcons}`,
	SortOrder: `${contributePrefix}.${ConfigKey.SortOrder}`,
	Bindings: `${contributePrefix}.${ConfigKey.Bindings}`,
	Overrides: `${contributePrefix}.${ConfigKey.Overrides}`,
};

export const Commands = {
	Register: `${contributePrefix}.${CommandKey.Register}`,
	RegisterLayer: `${contributePrefix}.${CommandKey.RegisterLayer}`,
	Show: `${contributePrefix}.${CommandKey.Show}`,
	ShowLayer: `${contributePrefix}.${CommandKey.ShowLayer}`,
	ShowTransient: `${contributePrefix}.${CommandKey.ShowTransient}`,
	Trigger: `${contributePrefix}.${CommandKey.Trigger}`,
	SearchBindings: `${contributePrefix}.${CommandKey.SearchBindings}`,
	RepeatRecent: `${contributePrefix}.${CommandKey.RepeatRecent}`,
	RepeatMostRecent: `${contributePrefix}.${CommandKey.RepeatMostRecent}`,
	ToggleZen: `${contributePrefix}.${CommandKey.ToggleZenMode}`,
	OpenFile: `${contributePrefix}.${CommandKey.OpenFile}`,
};
