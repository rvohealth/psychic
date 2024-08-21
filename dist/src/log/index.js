"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const colors = __importStar(require("colorette"));
const logo_1 = __importDefault(require("../psychic-application/logo"));
const luxon_1 = require("luxon");
class Logger {
    get header() {
        return `[${luxon_1.DateTime.now().toLocaleString(luxon_1.DateTime.DATETIME_SHORT_WITH_SECONDS)}]: `;
    }
    puts(text, color = 'magentaBright') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        console.log(colors[color](text).split('\n').join('\n  '));
    }
    info(text) {
        this.puts(text, 'blue');
    }
    error(error) {
        if (typeof error === 'string') {
            this.puts(error, 'red');
        }
        else {
            this.puts(error.message, 'red');
            this.puts(error.stack);
        }
    }
    welcome() {
        this.puts((0, logo_1.default)());
    }
}
exports.Logger = Logger;
const log = new Logger();
exports.default = log;
