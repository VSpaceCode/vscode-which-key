# vscode-which-key (Preview)

This extension is aimed to provide the standalone which-key function in VScode for both users and extension to bundle.

## Features

- All menu items are customizable
- The menu key is customizable
- Extension can bundle this to provide which-key menu


## Usage

See [here](https://vspacecode.github.io/docs/usage).

## Extra
This section config extra settings that pertain to both Standalone or With extension.

### Use non-character keys
This section describes a way to use non-character keys in which-key menu like `<tab>` or `Control+D`. `<tab>` is supported out of the box. Follow the following instruction to add support for keys other than `<tab>`.

Merge the following json to your `keybindings.json`.

```json
{
  "key": "ctrl+x",
  "command": "whichkey.triggerKey",
  "args": "C-x",
  "when": "whichkeyActive"
}
```

Once you've done that, you can use `C-x` in the `key` value of the which-key config. Effectively, the above keybinding will enter `C-x` in the QuickPick input box when `ctrl+x` is pressed when the which key is focused.

### Display menu with a delay
You can set `whichkey.delay` in `settings.json` to value in millisecond to delay the display of the menu.

### Display menu items alphabetically
You can set `whichkey.sortOrder` in `settings.json` to `alphabetically` to always display the menu items alphabetically.

### Unclear selection
Selected text can be hard to see when which-key menu is active. This could be due to the `inactiveSelectionBackground` config of your current theme. You can selectively override that color in your `settings.json` like the following example.

```json
"workbench.colorCustomizations": {
    "editor.inactiveSelectionBackground": "color that works better",
},
```

### Conditional bindings (experimental)
<details>
  <summary>Click to expand!</summary>

> This is marked as experimental and the config is subject to change.

This allows conditional execution of bindings. Currently, it only supports conditions on the `when` passed from shortcut and `languageId` of the active editor.

- It reuses the similar structure to the `bindings` type.
- The property `key` in a binding item is reused to represent the condition.
- The condition can be thought of as a key-value pair serialized into a string.

`languageId:javascript;when:sideBarVisible` is an example condition serialized into a string for the `key` that checks if the language id of the currently active editor is javascript and if the side bar is visible (see the [when](#when) section for more details).

A concrete example of a binding with that condition is as follow:

```json
{
  "whichkey.bindings": [
    {
      "key": "m",
      "name": "Major...",
      "type": "conditional",
      "bindings": [
        {
          "key": "languageId:javascript;when:sideBarVisible",
          "name": "Open file",
          "type": "command",
          "command": "workbench.action.files.openFileFolder"
        },
        {
          "key": "",
          "name": "Buffers",
          "type": "bindings",
          "bindings": [
            {
              "key": "b",
              "name": "Show all buffers/editors",
              "type": "command",
              "command": "workbench.action.showAllEditors"
            }
          ]
        },
      ]
    }
  ]
}
```

In this example, when `m` is pressed, it will find the first binding that matches the current condition.
If no configured key matches the current condition, a default item showing a buffer menu will be used.
Any item that has an invalid key will be used as default item.

Therefore, in this example, if the language is javascript and the sidebar is visible, `m` will open
the file browser, otherwise it will show the "buffers" menu.

#### Overrides

This is again similar with the `bindings` type.

For example, the following config will override the `m` binding completely:

```json
{
  "whichkey.bindingOverrides": [
    {
      "keys": "m",
      "name": "Major",
      "type": "conditional",
      "bindings": [
        {
          "key": "languageId:javascript",
          "name": "Go to",
          "type": "command",
          "command": "workbench.action.gotoLine",
        }
      ]
    }
  ]
}
```

You can also choose to add or remove conditions to existing conditional bindings.
For example, the following will add a key of `languageId:javascript` to the conditional binding if `languageId:javascript` doesn't already exist.

```json
{
  "whichkey.bindingOverrides": [
    {
      "keys": ["m", "languageId:javascript"],
      "name": "Go to",
      "type": "command",
      "command": "workbench.action.gotoLine",
    }
  ]
}
```

Negative `position` property can also be used to remove conditional bindings.

#### when

Since VSCode doesn't allow reading of the context of a json field, we cannot read the condition used in the `when` in shortcuts.
For this reason, you will need to repeat every `when` condition used in conditional bindings, at least until [vscode/#10471](https://github.com/microsoft/vscode/issues/10471) is implemented.

For example, the following shortcut in `keybindings.json` will pass both `key` and `when` in the `args` to `which-key`. The outer `when` is the [condition clause](https://code.visualstudio.com/docs/getstarted/keybindings#_when-clause-contexts) for vscode to execute this key, and must contain `whichKeyVisible` which limits this shortcut to be only applicable when the which-key menu is visible. In this case, if a user presses key `t` when which-key, sidebar and explorer viewlet are visible, it will execute `whichkey.triggerKey` command and send the `args` (`key` and `when`) to  `which-key` 

```json
{
  "key": "t",
  "command": "whichkey.triggerKey",
  "args": {
    "key": "t",
    "when": "sideBarVisible && explorerViewletVisible"
  },
  "when": "whichkeyVisible && sideBarVisible && explorerViewletVisible"
}
```

The `args.key` and `args.when` that were sent to `which-key` are then used to find the a binding that matches the key `t` and any conditional binding that matches that condition. The following binding is an example that contains a conditional binding that matches the `args`.

```json
{
  "key": "t",
  "name": "Show tree/explorer view",
  "type": "conditional",
  "bindings": [
    {
      "key": "",
      "name": "default",
      "type": "command",
      "command": "workbench.view.explorer"
    },
    {
      "key": "when:sideBarVisible && explorerViewletVisible",
      "name": "Hide explorer",
      "type": "command",
      "command": "workbench.action.toggleSidebarVisibility"
    }
  ]
}
```

Unfortunately, if you have another condition binding with a different `key` that want to match the same `when` condition as the `t` in the above example, you will need to setup another shortcut with that different `key`.

#### languageId

This is language id of the active editor. The language id can be found in language selection menu inside the parenthesis next to the language name.

</details>

## Release Notes

See [CHANGELOG.md](CHANGELOG.md)

## [Contribution](CONTRIBUTING.md)
All feature requests and help are welcome. Please open an issue to track.

## Credits
Thanks @kahole for his implementation of quick pick menu in edamagit.
