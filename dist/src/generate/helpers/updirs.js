"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function updirs(numUpdirs) {
    if (numUpdirs === 0)
        return './';
    let updirs = '';
    for (let i = 0; i < numUpdirs; i++) {
        updirs += '../';
    }
    return updirs;
}
exports.default = updirs;
