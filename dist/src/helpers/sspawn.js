"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ssspawn = void 0;
const child_process_1 = require("child_process");
function sspawn(command, 
// eslint-disable-next-line @typescript-eslint/no-explicit-any
opts = {}) {
    return new Promise((accept, reject) => {
        ssspawn(command, opts).on('close', code => {
            if (code !== 0)
                reject(code);
            accept({});
        });
    });
}
exports.default = sspawn;
function ssspawn(command, 
// eslint-disable-next-line @typescript-eslint/no-explicit-any
opts = {}) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return (0, child_process_1.spawn)(command, {
        stdio: 'inherit',
        shell: true,
        ...opts,
    });
}
exports.ssspawn = ssspawn;
