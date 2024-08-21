"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const setCoreDevelopmentFlag_1 = __importDefault(require("./setCoreDevelopmentFlag"));
function dreamjsOrDreamtsCmd(cmd, programArgs, { cmdArgs = [] } = {}) {
    const coreDevFlag = (0, setCoreDevelopmentFlag_1.default)(programArgs);
    const useTsnode = programArgs.includes('--tsnode') || process.env.TS_SAFE === '1';
    const dreamCmd = useTsnode ? 'dreamts' : 'dreamjs';
    const omitDistFromPathEnv = useTsnode ? 'PSYCHIC_OMIT_DIST_FOLDER=1 ' : '';
    const basepath = process.env.PSYCHIC_CORE_DEVELOPMENT === '1' ? '' : '../../../';
    if (useTsnode)
        cmdArgs.push('--tsnode');
    const fullcmd = `${coreDevFlag}${omitDistFromPathEnv}yarn --cwd=${basepath}node_modules/@rvohealth/dream ${dreamCmd} ${cmd} ${cmdArgs.join(' ')} `;
    return fullcmd;
}
exports.default = dreamjsOrDreamtsCmd;
