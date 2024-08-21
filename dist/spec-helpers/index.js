"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.specRequest = exports.createPsychicServer = exports.backgroundJobCompletionPromise = exports.SpecRequest = void 0;
require("@rvohealth/dream/spec-helpers");
const background_1 = __importDefault(require("../src/background"));
const server_1 = __importDefault(require("../src/server"));
const spec_request_1 = __importDefault(require("./spec-request"));
var spec_request_2 = require("./spec-request");
Object.defineProperty(exports, "SpecRequest", { enumerable: true, get: function () { return spec_request_2.SpecRequest; } });
// Example usage:
//   const bgComplete = backgroundJobCompletionPromise()
//   await UserEventHandler.handleUserEvent(userEvent)
//   await bgComplete
// At this point, the background job will have run
async function backgroundJobCompletionPromise() {
    await background_1.default.connect();
    return new Promise(accept => {
        background_1.default.workers.forEach(worker => {
            worker.addListener('completed', () => {
                accept(undefined);
            });
        });
    });
}
exports.backgroundJobCompletionPromise = backgroundJobCompletionPromise;
const _server = undefined;
async function createPsychicServer() {
    if (_server)
        return _server;
    const server = new server_1.default();
    await server.boot();
    return server;
}
exports.createPsychicServer = createPsychicServer;
exports.specRequest = spec_request_1.default;
