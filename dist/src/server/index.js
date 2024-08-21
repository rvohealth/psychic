"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dream_1 = require("@rvohealth/dream");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const background_1 = require("../background");
const cable_1 = __importDefault(require("../cable"));
const envValue_1 = require("../helpers/envValue");
const portValue_1 = __importDefault(require("../helpers/portValue"));
const psychic_application_1 = __importDefault(require("../psychic-application"));
const router_1 = __importDefault(require("../router"));
const front_end_client_1 = __importDefault(require("./front-end-client"));
const startPsychicServer_1 = __importDefault(require("./helpers/startPsychicServer"));
class PsychicServer {
    constructor() {
        this.booted = false;
        this.buildApp();
    }
    get config() {
        return psychic_application_1.default.getOrFail();
    }
    async routes() {
        const r = new router_1.default(this.app, this.config);
        const psychicApp = psychic_application_1.default.getOrFail();
        await psychicApp.routesCb(r);
        return r.routes;
    }
    async boot() {
        if (this.booted)
            return;
        await this.config['runHooksFor']('boot');
        this.initializeCors();
        this.initializeJSON();
        try {
            await this.config.boot();
        }
        catch (err) {
            const error = err;
            console.error(error);
            throw new Error(`
        Failed to boot psychic config. the error thrown was:
          ${error.message}
      `);
        }
        for (const expressInitHook of this.config.specialHooks.expressInit) {
            await expressInitHook(this.app);
        }
        await this.buildRoutes();
        for (const afterRoutesHook of this.config.specialHooks['after:routes']) {
            await afterRoutesHook(this.app);
        }
        if (this.config.useWs)
            this.cable = new cable_1.default(this.app, this.config);
        this.booted = true;
        return true;
    }
    // TODO: use config helper for fetching default port
    async start(port = (0, portValue_1.default)(), { withFrontEndClient = (0, envValue_1.envBool)('CLIENT'), frontEndPort = 3000, } = {}) {
        await this.boot();
        if (withFrontEndClient) {
            this.frontEndClient = new front_end_client_1.default();
            this.frontEndClient.start(frontEndPort);
            process.on('SIGTERM', () => {
                this.frontEndClient?.stop();
            });
        }
        if (this.config.useWs && this.cable) {
            // cable starting will also start
            // an encapsulating http server
            await this.cable.start(port, { withFrontEndClient, frontEndPort });
            this.server = this.cable.http;
        }
        else {
            await new Promise(accept => {
                (0, startPsychicServer_1.default)({
                    app: this.app,
                    port,
                    withFrontEndClient,
                    frontEndPort,
                    sslCredentials: this.config.sslCredentials,
                })
                    .then(server => {
                    this.server = server;
                    accept({});
                })
                    .catch(() => { });
            });
        }
        return true;
    }
    async stop() {
        this.server?.close();
        await (0, background_1.stopBackgroundWorkers)();
        await (0, dream_1.closeAllDbConnections)();
    }
    async serveForRequestSpecs(block) {
        const port = process.env.PORT;
        if (!port)
            throw 'Missing `PORT` environment variable';
        await this.boot();
        let server;
        await new Promise(accept => {
            server = this.app.listen(port, () => accept({}));
        });
        await block();
        server.close();
        return true;
    }
    buildApp() {
        this.app = (0, express_1.default)();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.app.use((0, cookie_parser_1.default)());
    }
    initializeCors() {
        this.app.use((0, cors_1.default)(this.config.corsOptions));
    }
    initializeJSON() {
        this.app.use(express_1.default.json(this.config.jsonOptions));
    }
    async buildRoutes() {
        const r = new router_1.default(this.app, this.config);
        const psychicApp = psychic_application_1.default.getOrFail();
        await psychicApp.routesCb(r);
        r.commit();
    }
}
exports.default = PsychicServer;
