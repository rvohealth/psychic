"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = __importDefault(require("./index"));
class DBMissingOptions extends index_1.default {
    constructor(error) {
        super(`
Failed to locate the database options required to bootstrap your psychic app.
Please make sure the following file is present in your app:

  conf/db.ts

the underlying error that triggered this message was:
  ${error.message}
`);
    }
}
exports.default = DBMissingOptions;
