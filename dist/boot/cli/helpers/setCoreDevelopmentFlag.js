"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.coreSuffix = void 0;
function setCoreDevelopmentFlag(programArgs) {
    if (process.env.PSYCHIC_CORE_DEVELOPMENT === '1' || programArgs.includes('--core')) {
        process.env.PSYCHIC_CORE_DEVELOPMENT = '1';
        return 'PSYCHIC_CORE_DEVELOPMENT=1 ';
    }
    else {
        return '';
    }
}
exports.default = setCoreDevelopmentFlag;
function coreSuffix(programArgs) {
    return programArgs.includes('--core') ? ' --core' : '';
}
exports.coreSuffix = coreSuffix;
