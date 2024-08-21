"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class DBError extends Error {
    constructor(message) {
        super();
        this._message = message;
    }
    get message() {
        return `
      A Database error occured, causing psychic to crash. The message recieved was:
        ${this._message}
    `;
    }
}
exports.default = DBError;
