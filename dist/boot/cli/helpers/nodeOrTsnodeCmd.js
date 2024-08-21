"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const setCoreDevelopmentFlag_1 = __importDefault(require("./setCoreDevelopmentFlag"));
const omitCoreArg_1 = __importDefault(require("./omitCoreArg"));
function nodeOrTsnodeCmd(filePath, programArgs, { nodeFlags = [], tsnodeFlags = [], fileArgs = [], } = {}) {
    const coreDevFlag = (0, setCoreDevelopmentFlag_1.default)(programArgs);
    const useTsnode = programArgs.includes('--tsnode') || process.env.TS_SAFE === '1';
    const nodeCmd = useTsnode ? 'npx ts-node' : 'node';
    const omitDistFromPathEnv = useTsnode ? 'PSYCHIC_OMIT_DIST_FOLDER=1 ' : '';
    const realFilePath = useTsnode ? filePath : path_1.default.join('dist', filePath.replace(/\.ts$/, '.js'));
    if (useTsnode)
        fileArgs.push('--tsnode');
    return `${coreDevFlag}${omitDistFromPathEnv}${nodeCmd} ${(useTsnode ? tsnodeFlags : nodeFlags).join(' ')} ${realFilePath} ${fileArgs.join(' ')} ${(0, omitCoreArg_1.default)(programArgs).join(' ')}`;
}
exports.default = nodeOrTsnodeCmd;
