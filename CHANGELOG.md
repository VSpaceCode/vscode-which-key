# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.9.2] - 2021-06-27

### Changed

- Add additional padding for icons

## [0.9.1] - 2021-06-19

### Fixed

- Fix an issue where using vim to call `whichkey.show` without any params failed

### Changed

- Update the name of `<spc> r .` to be more descriptive.

## [0.9.0] - 2021-06-18

### Added

- Add icons support for which-key menu ([#41](https://github.com/VSpaceCode/vscode-which-key/issues/41)).
  - Only vscode [product icon](https://code.visualstudio.com/api/references/icons-in-labels) can be used.
  - An extra property `icon` is used in the definition of which-key binding, which-key overrides, and transient binding.
    An example which-key binding with the icon property is as follow.

    ```json
    {
        "key": " ",
        "name": "Commands",
        "icon": "rocket",
        "type": "command",
        "command": "workbench.action.showCommands"
    }
    ```

- Implement the ability to search the bindings and execute a command (`whichkey.searchBindings`) where
  it can be triggered with `<spc> ?` or `C-h` while the which-key is visible ([#12](https://github.com/VSpaceCode/vscode-which-key/issues/12)).
- Add zen mode command (`whichkey.toggleZenMode`) to transient menu.
  - When the command is executed with a visible transient menu, all the menu items will be hidden/shown.
  - The command can be bound to the transient menu binding item or as a shortcut in your `keybindings.json` as follows.

    ```json
    {
        "key": "ctrl+z",
        "command": "whichkey.toggleZenMode",
        "when": "transientVisible"
    }
    ```

  - No default shortcut is bound at the moment.
  - This is implemented to show more content of the buffer instead being block by the QuickPick menu.
- Add repeater to record and repeat previously executed command ([#27](https://github.com/VSpaceCode/vscode-which-key/issues/27)).
  - Command `whichkey.repeatRecent` will show a which key menu to select all previous command executed in whichkey and bound to `<spc> r .` by default.
  - Command `whichkey.repeatMostRecent` will execute the recently command executed in whichkey.

### Changed

- Reimplemented transient menu as a separate command (`whichkey.showTransient`).
  - Existing transient defined as part of which-key menu with type `transient` is **deprecated** and will continue to work.
  - Remove redundant transient definition which allows sharing ([#13](https://github.com/VSpaceCode/vscode-which-key/issues/13)) by letting transient menu config/bindings to be defined in config. For example, calling `whichkey.showTransient` with `whichkey.transient.lineMoving` will mean that the transient config lives in `whichkey.transient.lineMoving`.
  - Add `exit` property in the binding definition to indicate that certain key in will exit on selection.
  - Add `transientVisible` context when transient is visible, and `whichkeyVisible` context will no longer be `true` when transient menu is visible.

### Removed

- Remove `+` prefix from non-binding type in the default bindings.

## [0.8.6] - 2021-06-11

### Fixed

- Properly fix QuickPick API change issue for vscode >= 1.57 (#34)

## [0.8.5] - 2021-05-12

### Fixed

- Fix the name of `<spc> g s` binding.
- Fix vscode 1.57 insider QuickPick API change issue (#34).

## [0.8.4] - 2020-12-14

### Fixed

- Fix the issue `<spc> f f` doesn't work on non-Mac environment.

## [0.8.3] - 2020-12-11

### Changed

- Indicate submenus with `+` instead of `...`.

## [0.8.2] - 2020-10-06

### Fixed

- Fix the issue where `<tab>` key can not be use in the editor because the context `whichkeyVisible` is stuck in true if triggerKey command with an invalid key was called before the menu is displayed.
- Fix the issue where key failed to append if the input was selected during the delay. The case was prominent when triggerKey was called before the menu is displayed (The key entered by triggerKey will be selected by the time the menu is displayed).
- Fix the issue where the key is selected if `triggerKey` is called subsequent to `show` command with vim binding by having `show` command to wait until the QuickPick's show is called.

## [0.8.1] - 2020-09-02

### Fixed

- Fix the issue where multiple status bar messages are displayed.

## [0.8.0] - 2020-09-02

### Added

- Add color on the status bar message when key binding entered is not defined.
- Add support for a new conditional type binding, which allows conditional binding execution. See README for more information on how to use it.

## [0.7.6] - 2020-08-03

### Added

- Add an option to sort non-number first for keys of the menu items.

### Changed

- Change `<spc> b Y` to deselect after copying.

## [0.7.5] - 2020-08-01

### Added

- Add a configuration (`whichkey.sortOrder`) to sort menu items.

## [0.7.4] - 2020-07-27

### Changed

- Change the command `whichkey.show` to be non-blocking.

### Fixed

- Fix a bug where only the first occurrence of ␣ and ↹ will be replaced.

## [0.7.3] - 2020-07-23

### Added

- Add `<spc> s r` to search reference.
- Add `<spc> s R` to search reference in side bar.
- Add `<spc> s J` to jump symbol in the workspace.

### Changed

- Change `<spc> s j` to jump to symbol in file.

## [0.7.2] - 2020-07-20

### Fixed

- Fix typo and grammar in default binding names.

## [0.7.1] - 2020-07-19

### Security

- Update lodash for GHSA-p6mc-m468-83gw.

## [0.7.0] - 2020-07-09

### Added

- Add `<spc> b H/J/K/L` for directional editor moving.
- Support running this extension locally with VSCode Remote.

## [0.6.0] - 2020-07-09

### Added

- Implement an a way to use non-character key like `<tab>` and `<ctrl>` in which-key menu.
- Implement a way to delay menu display with a configurable timeout in settings.
- Add better error message when executing binding with incorrect properties.
- Add `<spc> <tab>` to switch to last editor.

## [0.5.3] - 2020-07-02

### Fixed

- Fix an issue where the which key menu will not reopen once the transient menu is closed.

## [0.5.2] - 2020-06-30

### Fixed

- Fix the issue where menu is empty when called from vscode vim.

## [0.5.1] - 2020-06-28

### Added

- Use webpack to reduce extension size.

## [0.5.0] - 2020-06-23

### Added

- Split which-key menu function from VSpaceCode of `v0.4.0`.
