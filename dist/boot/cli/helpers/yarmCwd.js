"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function yarnCwd(programArgs) {
    return programArgs.includes('--core') ? '' : ' --cwd=../../ ';
}
exports.default = yarnCwd;
