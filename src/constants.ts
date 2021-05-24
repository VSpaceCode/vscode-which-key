export const extensionId = 'vscode-which-key';
export const publisherId = 'VSpaceCode';
export const contributePrefix = 'whichkey';
export enum ConfigKey {
	Delay = "delay",
	ShowIcons = "showIcons",
	SortOrder = "sortOrder",
	Bindings = "bindings",
	Overrides = "bindingOverrides",
}
export enum CommandKey {
	Show = 'show',
	Register = 'register',
	Trigger = 'triggerKey',
	DescribeBindings = 'describeBindings',
	ShowTransient = 'showTransient',
	ShowPreviousActions = 'showPreviousActions',
	RepeatLastAction = 'repeatLastAction',
	ToggleZenMode = 'toggleZenMode',
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
	ShowIcons: `${contributePrefix}.${ConfigKey.ShowIcons}`,
	SortOrder: `${contributePrefix}.${ConfigKey.SortOrder}`,
	Bindings: `${contributePrefix}.${ConfigKey.Bindings}`,
	Overrides: `${contributePrefix}.${ConfigKey.Overrides}`,
};

export const Commands = {
	Show: `${contributePrefix}.${CommandKey.Show}`,
	Register: `${contributePrefix}.${CommandKey.Register}`,
	Trigger: `${contributePrefix}.${CommandKey.Trigger}`,
	DescribeBindings: `${contributePrefix}.${CommandKey.DescribeBindings}`,
	ShowTransient: `${contributePrefix}.${CommandKey.ShowTransient}`,
	ShowPreviousActions: `${contributePrefix}.${CommandKey.ShowPreviousActions}`,
	RepeatLastAction: `${contributePrefix}.${CommandKey.RepeatLastAction}`,
	ToggleZen: `${contributePrefix}.${CommandKey.ToggleZenMode}`,
	OpenFile: `${contributePrefix}.${CommandKey.OpenFile}`,
};
