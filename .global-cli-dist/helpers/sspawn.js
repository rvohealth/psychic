"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = sspawn;
exports.ssspawn = ssspawn;
const child_process_1 = require("child_process");
function sspawn(command, opts = {}) {
    return new Promise((accept, reject) => {
        ssspawn(command, opts).on('close', code => {
            if (code !== 0)
                reject(code);
            accept({});
        });
    });
}
function ssspawn(command, opts = {}) {
    return (0, child_process_1.spawn)(command, {
        stdio: 'inherit',
        shell: true,
        ...opts,
    });
}
