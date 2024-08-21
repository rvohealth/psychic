"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function developmentOrTestEnv() {
    return ['development', 'test'].includes(process.env.NODE_ENV || '');
}
exports.default = developmentOrTestEnv;
