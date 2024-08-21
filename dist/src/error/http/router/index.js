"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = __importDefault(require("../index"));
class RouterError extends index_1.default {
    constructor(message, httpStatusCode = 500) {
        super(httpStatusCode, message);
    }
    get message() {
        return `
      A Router error occured, causing psychic to crash. The message recieved was:
        ${this._message}
    `;
    }
}
exports.default = RouterError;
