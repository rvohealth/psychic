"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = __importDefault(require("./index"));
class DBFailedToConnect extends index_1.default {
    constructor(error) {
        super(`
Failed to connect to the database using the credentials located at:

  conf/db.ts

Please check that your credentials are valid, and then try again.
The underlying error that triggered this message was:
  ${error.message}
`);
    }
}
exports.default = DBFailedToConnect;
