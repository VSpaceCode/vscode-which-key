# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- Add color on the status bar message when key binding entered is not defined

## [0.7.6] - 2020-08-03
### Added
- Add an option to sort non-number first for keys of the menu items

### Changed
- Change `<spc> b Y` to deselect after copying

## [0.7.5] - 2020-08-01
### Added
- Add a configuration (`whichkey.sortOrder`) to sort menu items

## [0.7.4] - 2020-07-27
### Changed
- Change the command `whichkey.show` to be non-blocking

### Fixed
- Fix a bug where only the first occurrence of ␣ and ↹ will be replaced

## [0.7.3] - 2020-07-23
### Added
- Add `<spc> s r` to search reference
- Add `<spc> s R` to search reference in side bar
- Add `<spc> s J` to jump symbol in the workspace

### Changed
- Change `<spc> s j` to jump to symbol in file

## [0.7.2] - 2020-07-20
### Fixed
- Fix typo and grammar in default binding names

## [0.7.1] - 2020-07-19
### Security
- Update lodash for GHSA-p6mc-m468-83gw

## [0.7.0] - 2020-07-09
### Added
- Add `<spc> b H/J/K/L` for directional editor moving
- Support running this extension locally with VSCode Remote

## [0.6.0] - 2020-07-09
### Added
- Implement an a way to use non-character key like `<tab>` and `<ctrl>` in which-key menu
- Implement a way to delay menu display with a configurable timeout in settings
- Add better error message when executing binding with incorrect properties
- Add `<spc> <tab>` to switch to last editor

## [0.5.3] - 2020-07-02
### Fixed
- Fix an issue where the which key menu will not reopen once the transient menu is closed

## [0.5.2] - 2020-06-30
### Fixed
- Fix the issue where menu is empty when called from vscode vim

## [0.5.1] - 2020-06-28
### Added
- Use webpack to reduce extension size

## [0.5.0] - 2020-06-23
### Added
- Split which-key menu function from VSpaceCode of`v0.4.0`