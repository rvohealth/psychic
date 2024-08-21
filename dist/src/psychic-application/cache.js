"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCachedPsychicApplicationOrFail = exports.getCachedPsychicApplication = exports.cachePsychicApplication = void 0;
let _psychicApp = undefined;
function cachePsychicApplication(psychicApp) {
    _psychicApp = psychicApp;
}
exports.cachePsychicApplication = cachePsychicApplication;
function getCachedPsychicApplication() {
    return _psychicApp;
}
exports.getCachedPsychicApplication = getCachedPsychicApplication;
function getCachedPsychicApplicationOrFail() {
    if (!_psychicApp)
        throw new Error('must call `cachePsychicApplication` before loading cached psychic app');
    return _psychicApp;
}
exports.getCachedPsychicApplicationOrFail = getCachedPsychicApplicationOrFail;
