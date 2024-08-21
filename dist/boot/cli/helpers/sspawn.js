"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ssspawn = void 0;
const child_process_1 = require("child_process");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sspawn(command, opts = {}) {
    return new Promise((accept, reject) => {
        ssspawn(command, opts).on('close', code => {
            if (code !== 0)
                reject(code);
            accept({});
        });
    });
}
exports.default = sspawn;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ssspawn(command, opts = {}) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return (0, child_process_1.spawn)(command, {
        stdio: 'inherit',
        shell: true,
        ...opts,
    });
}
exports.ssspawn = ssspawn;
