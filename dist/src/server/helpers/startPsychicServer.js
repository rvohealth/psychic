"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPsychicHttpInstance = void 0;
const dream_1 = require("@rvohealth/dream");
const fs_1 = __importDefault(require("fs"));
const http_1 = __importDefault(require("http"));
const https_1 = __importDefault(require("https"));
const log_1 = __importDefault(require("../../log"));
async function startPsychicServer({ app, port, withFrontEndClient, frontEndPort, sslCredentials, }) {
    return await new Promise(accept => {
        const httpOrHttps = getPsychicHttpInstance(app, sslCredentials);
        const server = httpOrHttps.listen(port, () => {
            welcomeMessage({ port, withFrontEndClient, frontEndPort });
            accept(server);
        });
    });
}
exports.default = startPsychicServer;
function getPsychicHttpInstance(app, sslCredentials) {
    if (sslCredentials?.key && sslCredentials?.cert) {
        return https_1.default.createServer({
            key: fs_1.default.readFileSync(sslCredentials.key),
            cert: fs_1.default.readFileSync(sslCredentials.cert),
        }, app);
    }
    else {
        return http_1.default.createServer(app);
    }
}
exports.getPsychicHttpInstance = getPsychicHttpInstance;
function welcomeMessage({ port, withFrontEndClient, frontEndPort, }) {
    if (!(0, dream_1.testEnv)()) {
        log_1.default.welcome();
        log_1.default.puts(`psychic dev server started at port ${port}`);
        if (withFrontEndClient)
            log_1.default.puts(`client dev server on port ${frontEndPort}`);
    }
}
