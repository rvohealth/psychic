"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = generateEncryptionKey;
function generateEncryptionKey() {
    return (Math.random().toString(36).substr(2, 10) +
        '-' +
        Math.random().toString(36).substr(2, 10) +
        '-' +
        Math.random().toString(36).substr(2, 10) +
        '-' +
        Math.random().toString(36).substr(2, 10) +
        '-' +
        Math.random().toString(36).substr(2, 10) +
        '-' +
        Math.random().toString(36).substr(2, 10) +
        '-' +
        Math.random().toString(36).substr(2, 10) +
        '-' +
        Math.random().toString(36).substr(2, 10) +
        '-' +
        Math.random().toString(36).substr(2, 10) +
        '-' +
        Math.random().toString(36).substr(2, 10) +
        '-' +
        Math.random().toString(36).substr(2, 10));
}
