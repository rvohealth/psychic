"use strict";
// this is set because all CLI commands hijack the project root.
// in a normal scenario for something running in a psychic app,
// process.cwd() will point to the consuming app's root directory
// (which we will call <APP_ROOT>).
Object.defineProperty(exports, "__esModule", { value: true });
// However, when a cli command is executed on behalf of a consuming app,
// the root directory accidentally becomes <APP_ROOT>/node_modules/psychic,
// causing all of our imports to trip up. To alleviate this,
// we have this env var to inform the app to consider the app root to be up two more dirs
// than it normally does.
function hijackRootForCLI() {
    process.env.EXECUTED_ON_BEHALF_OF_CONSUMING_APP_BY_CLI = '1';
}
exports.default = hijackRootForCLI;
