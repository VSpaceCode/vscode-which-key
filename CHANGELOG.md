# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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