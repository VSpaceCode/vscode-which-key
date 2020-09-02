# vscode-which-key (Preview)

This extension is aimed to provide the standalone which-key function in VScode for both users and extension to bundle.

## Features

- All menu items are customizable
- The menu key is customizable
- Extension can bundle this to provide which-key menu


## Usage

This extension can be used by itself or be called by other extension.

### Standalone

This extension comes with a default that didn't have any third-party dependencies.
#### Setup: I am using VSCode Vim
If you want a better default behavior design for VSCode Vim, checkout [VSpaceCode](https://github.com/VSpaceCode/VSpaceCode).

Add the menu key as follows in `settings.json`. This following example is to let VSCode Vim to capture the `space` key and trigger the action menu in normal mode and visual mode.
> To access `settings.json`, you can search `Setting` in the command list with `Ctl+Shift+P` or `Cmd+Shift+P` and select `Preference: Open Settings (JSON)`.

> If you have existing config for `vim.normalModeKeyBindingsNonRecursive` or `vim.visualModeKeyBindingsNonRecursive`, make sure you add to the array instead of replace them.

```json
"vim.normalModeKeyBindingsNonRecursive": [
  {
    "before": ["<space>"],
    "commands": ["whichkey.show"]
  }
],
"vim.visualModeKeyBindingsNonRecursive": [
  {
    "before": ["<space>"],
    "commands": ["whichkey.show"]
  }
]
```

You can also bind a customize menu with Vim directly

```javascript
"vim.visualModeKeyBindingsNonRecursive": [
  {
    "before": ["<space>"],
    "commands": ["whichkey.show"],
  }
]
```

#### Setup: I am *not* using VSCode Vim
Add the command as follows in `keybindings.json`. This following json is an example to bind `alt+space` to the action menu when a text editor is in focus.

> To access `keybindings.json`, you can search `Keyboard` in the command list with `Ctl+Shift+P` or `Cmd+Shift+P` and select `Preference: Open Keyboard Shortcuts (JSON)`.

```json
{
  "key": "alt+space",
  "command": "whichkey.show",
  "when": "editorTextFocus"
},
```

#### Menu Customization

There are two ways to customize the menu: incrementally, and from scratch. Incrementally is great for when you only need to modify a few bindings from the default. Customizing from scratch is great for total control and the customization.

> The default bindings are subject to change before `1.0.0`. If you find something you that think it should bind to a particular key by default, or you want a particular command, please open an issue as a feature request.

##### Incrementally
Using this option will allow to you surgically update the default bindings (`whichkey.bindings`). The extension will override bindings sequentially base on `whichkey.bindingOverrides`.

##### Add/Replace
The following json will replace `<SPC> g s` in the same position if the binding exists in `whichkey.bindings`, and append `s` to menu `<SPC> g` if it doesn't exists. This override will only execute if `<SPC> g` menu exists. An optional `position` key can be used to specified index of where the item should be inserted/moved to.

```jsonc
{
  "whichkey.bindingOverrides": [
    {
      "keys": "g.s",
      "name": "Go to line",
      "type": "command",
      "command":"workbench.action.gotoLine",
    }
  ]
}
```
The following example will replace/append the whole `<SPC> g` menu with one binding `s` in it.
```jsonc
{
  "whichkey.bindingOverrides": [
    {
      "keys": "g",
      "name": "Go...",
      "type": "bindings",
      "bindings": [
        {
          "key": "s",
          "name": "Go to",
          "type": "command",
          "command": "workbench.action.gotoLine",
        }
      ]
    }
  ]
}
```
If the key binding's key uses character `.` like `<SPC> e .`, you can target that by using an array in the keys like `"keys": ["e", "."]`.

##### Removal
Any negative number in position is denoting a removal operation. In the following example, any item bound to `<SPC> g s` will be remove.
```jsonc
{
  "whichkey.bindingOverrides": [
    {
      "keys": "g.s",
      "position": -1,
    }
  ]
}
```

##### From Scratch
To customize the menu items from scratch, you can override the menu completely by putting your own `whichkey.bindings` into your `settings.json`. Using this option will prevent any update to your own bindings.

An example of a `settings.json` file that overrides space menu is as follows:
```json
{
  "whichkey.bindings": [
    {
      "key": "f",
      "name": "File...",
      "type": "bindings",
      "bindings": [
        {
          "key": "f",
          "name": "Open file",
          "type": "command",
          "command": "workbench.action.files.openFileFolder"
        },
        {
          "key": "i",
          "name": "Indentation...",
          "type": "bindings",
          "bindings": [
            {
              "key": "i",
              "name": "Change indentation",
              "type": "command",
              "command": "changeEditorIndentation"
            },
            {
              "key": "d",
              "name": "Detect indentation",
              "type": "command",
              "command": "editor.action.detectIndentation"
            }
          ]
        }
      ]
    }
  ]
}
```

The default value can be found in the `contributes.configuration.whichkey.bindings.default` section of the `package.json` in this repo. You can use the default value as an example to craft your own custom menu.

### With extension
If you writing an extension and wanting to have which key functionality, you can bundle it with the extension pack feature of vscode. There is two mode of operation.

To bundle `which-key` to your extension, you can add `VSpaceCode.whichkey` to the `extensionDependencies` of your `package.json`. This will install `which-key` on upon installation of your extension and make sure `which-key` is activated before your extension.

#### Read from config
This mode will let `which-key` to mange the reading of the config from user's `settings.json`. `which-key` will load the specified config portion and update when the config is updated. This is suitable for large menu that might take a bit time to load.

1. Register to the location of the config

    The follow extension will tell `which-key` the bindings is living in `myExtension.bindings`, have an optional override config in `myExtension.bindingOverrides`, and have a title of `My Menu`. Note that overrides and title are optional.
    ```javascript
    commands.executeCommand("whichkey.register", {
      bindings: ["myExtension", "bindings"],
      overrides: ["myExtension", "bindingOveArrides"],
      title: "My menu"
    });
    ```
2. Launch the menu

    Once you registered the config location, the menu will be loaded, so the launch of the menu can be as quick as possible. The follow code is an example to launch a registered menu.
    ```javascript
    commands.executeCommand("whichkey.show", "myExtension.bindings");
    ```

#### Show directly
This is a simpler operating mode. In your extension, you can pass a `BindingItem` array when calling `whichkey.show`. However, this might not suitable for large bindings because of the load time.
```javascript
commands.executeCommand("whichkey.show", [
  {
    "key": "f",
    "name": "File...",
    "type": "bindings",
    "bindings": [
      {
        "key": "f",
        "name": "Open file",
        "type": "command",
        "command": "workbench.action.files.openFileFolder"
      },
      {
        "key": "i",
        "name": "Indentation...",
        "type": "bindings",
        "bindings": [
          {
            "key": "i",
            "name": "Change indentation",
            "type": "command",
            "command": "changeEditorIndentation"
          },
          {
            "key": "d",
            "name": "Detect indentation",
            "type": "command",
            "command": "editor.action.detectIndentation"
          }
        ]
      }
    ]
  }
]);
```



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

## Release Notes

See [CHANGELOG.md](CHANGELOG.md)

## [Contribution](CONTRIBUTING.md)
All feature requests and help are welcome. Please open an issue to track.

## Credits
Thanks @kahole for his implementation of quick pick menu in edamagit.
