"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = sleep;
function sleep(ms) {
    return new Promise(accept => {
        setTimeout(() => {
            accept({});
        }, ms);
    });
}
