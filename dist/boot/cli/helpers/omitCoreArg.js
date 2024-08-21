"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function omitCoreArg(programArgs) {
    return programArgs.filter(arg => arg !== '--core');
}
exports.default = omitCoreArg;
