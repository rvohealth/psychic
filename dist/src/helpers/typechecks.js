"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isObject = exports.isString = void 0;
function isString(
// eslint-disable-next-line @typescript-eslint/no-explicit-any
x) {
    return typeof x === 'string' || x instanceof String;
}
exports.isString = isString;
function isObject(
// eslint-disable-next-line @typescript-eslint/no-explicit-any
x) {
    if (x === null)
        return false;
    if (isString(x))
        return false;
    if (Array.isArray(x))
        return false;
    return typeof x === 'object';
}
exports.isObject = isObject;
