"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.devEnvBool = exports.envBool = exports.envInt = void 0;
function envValue(env) {
    return process.env[env];
}
exports.default = envValue;
function envInt(env) {
    const val = envValue(env);
    if (typeof parseInt(val) === 'number')
        return parseInt(val);
    return null;
}
exports.envInt = envInt;
function envBool(env) {
    return process.env[env] === '1';
}
exports.envBool = envBool;
function devEnvBool(env) {
    return process.env[env] === '1';
}
exports.devEnvBool = devEnvBool;
