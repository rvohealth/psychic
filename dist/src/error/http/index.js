"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class HttpError extends Error {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(statusCode, message, data) {
        super();
        this.status = statusCode;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        this.data = data;
        this._message = message;
    }
    get message() {
        return `
      An Http error with status ${this.status} has been thrown with message:
        ${this._message}
    `;
    }
}
exports.default = HttpError;
