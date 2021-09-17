# Contributing Guide

Thank you for taking the time to contributing to vscode-which-key.

## First Time Setup

1. Install prerequisites:
    - [Visual Studio Code](https://code.visualstudio.com/)
    - [Node.js](https://nodejs.org/)
2. Fork the repository
3. In a terminal

    ```sh
    # fork and clone the repository
    git clone git@github.com:<YOUR-FORK>/vscode-which-key.git
    cd vscode-which-key

    # Install the dependencies
    npm install

    # Open in VSCode
    code .
    ```

4. Install [TypeScript + Webpack Problem Matchers for VS Code](https://marketplace.visualstudio.com/items?itemName=eamodio.tsl-problem-matcher)
5. Go to debug tab select `Run Extension`

## Default binding menu

The default bindings of `which-key` are separate from the `VSpaceCode`
bindings. To see the bindings from the `package.json` in this repository, run
"Which Key: Show Menu" from the command palette (`Ctrl-Alt-P`, or `SPC SPC`
with `VSpaceCode`).

## Submitting Issues

Feel free to open an issue if the issue you are experiencing is not in already in the [Github issues](https://github.com/VSpaceCode/vscode-which-key/issues).

## Submitting Pull Requests

If you are submitting an pull request (PR) without a tracking issue, consider create an issue first. This is so that we can discuss different implementations if necessary.
