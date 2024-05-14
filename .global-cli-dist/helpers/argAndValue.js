"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function argAndValue(arg, args) {
    const argIndex = args.findIndex(a => a === arg);
    const foundArg = argIndex === -1 ? null : args[argIndex];
    const foundValue = argIndex === -1 ? null : valueOrNull(argIndex, args);
    return [foundArg, foundValue];
}
exports.default = argAndValue;
function valueOrNull(argIndex, args) {
    let value = args[argIndex + 1];
    if (/--/.test(value))
        value = null;
    return value;
}
