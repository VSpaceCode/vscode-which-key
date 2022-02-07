import { runTests } from "@vscode/test-web";
import * as path from "path";

async function main() {
    try {
        // The folder containing the Extension Manifest package.json
        // Passed to `--extensionDevelopmentPath`
        const extensionDevelopmentPath = path.resolve(__dirname, "../../");

        // The path to test runner
        // Passed to --extensionTestsPath
        const extensionTestsPath = path.resolve(__dirname, "./suite/index-web");

        // Start a web server that serves VSCode in a browser, run the tests
        await runTests({
            browserType: "chromium",
            version: "stable",
            extensionDevelopmentPath,
            extensionTestsPath,
        });
    } catch (err) {
        console.error(err);
        console.error("Failed to run tests");
        process.exit(1);
    }
}

main();
