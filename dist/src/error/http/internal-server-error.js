"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = __importDefault(require("./index"));
class InternalServerError extends index_1.default {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(message, data) {
        super(500, message, data);
    }
}
exports.default = InternalServerError;
