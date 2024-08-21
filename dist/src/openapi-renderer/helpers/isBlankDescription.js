"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isBlankDescription(obj) {
    if (typeof obj !== 'object')
        return false;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    if (Object.keys(obj).length > 1)
        return false;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return Object.keys(obj)[0] === 'description';
}
exports.default = isBlankDescription;
