import * as assert from "assert";
import * as vscode from "vscode";
import { extensionId } from "../../constants";

suite("Extension Test Suite", () => {
    vscode.window.showInformationMessage("Start all tests.");

    test("whichkey can be activated", async function () {
        this.timeout(1 * 60 * 1000);
        const extension = vscode.extensions.getExtension(extensionId);
        if (extension) {
            await extension.activate();
            assert.ok(extension.isActive);
        } else {
            assert.fail("Extension is not available");
        }
    });
});
