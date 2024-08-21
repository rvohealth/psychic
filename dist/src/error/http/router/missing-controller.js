"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = __importDefault(require("./index"));
class RouterMissingController extends index_1.default {
    constructor(controllerPath) {
        super(`\
The controller you are attempting to load was not found:
  ${controllerPath}
      `);
    }
}
exports.default = RouterMissingController;
