"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const setCoreDevelopmentFlag_1 = require("./setCoreDevelopmentFlag");
const yarmCwd_1 = __importDefault(require("./yarmCwd"));
function yarncmdRunByAppConsumer(command, programArgs) {
    const coreSuffixFlag = (0, setCoreDevelopmentFlag_1.coreSuffix)(programArgs);
    const nodeEnvPrefix = process.env.NODE_ENV ? `NODE_ENV=${process.env.NODE_ENV} ` : '';
    const cmd = `${nodeEnvPrefix}yarn ${(0, yarmCwd_1.default)(programArgs)}${command}${coreSuffixFlag}`;
    if (process.env.DEBUG === '1') {
        console.log('About to run command: ', cmd);
    }
    return cmd;
}
exports.default = yarncmdRunByAppConsumer;
