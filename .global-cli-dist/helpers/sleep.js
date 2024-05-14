"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function sleep(ms) {
    return new Promise(accept => {
        setTimeout(() => {
            accept({});
        }, ms);
    });
}
exports.default = sleep;
