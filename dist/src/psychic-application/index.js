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
const dream_1 = require("@rvohealth/dream");
const init_missing_api_root_1 = __importDefault(require("../error/psychic-application/init-missing-api-root"));
const init_missing_call_to_load_controllers_1 = __importDefault(require("../error/psychic-application/init-missing-call-to-load-controllers"));
const init_missing_routes_callback_1 = __importDefault(require("../error/psychic-application/init-missing-routes-callback"));
const cookieMaxAgeFromCookieOpts_1 = __importDefault(require("../helpers/cookieMaxAgeFromCookieOpts"));
const envValue_1 = __importDefault(require("../helpers/envValue"));
const cache_1 = require("./cache");
const loadControllers_1 = __importStar(require("./helpers/loadControllers"));
class PsychicApplication {
    constructor() {
        this.apiOnly = false;
        this.useWs = false;
        this.useRedis = false;
        this.appName = 'untitled app';
        this.corsOptions = {};
        this.openapi = {
            clientOutputFilename: 'openapi.ts',
            outputFilename: 'openapi.json',
            schemaDelimeter: '',
        };
        this.client = {
            apiPath: 'src/api',
        };
        this.paths = {
            controllers: 'src/app/controllers',
            controllerSpecs: 'spec/unit/controllers',
        };
        this.bootHooks = {
            boot: [],
            load: [],
            'load:dev': [],
            'load:test': [],
            'load:prod': [],
        };
        this.specialHooks = {
            expressInit: [],
            serverError: [],
            wsStart: [],
            wsConnect: [],
            'after:routes': [],
        };
        this.loadedControllers = false;
        this.booted = false;
    }
    static async init(cb, dreamCb) {
        let psychicApp;
        await dream_1.DreamApplication.init(dreamCb, {}, async (dreamApp) => {
            psychicApp = new PsychicApplication();
            await cb(psychicApp);
            if (!psychicApp.loadedControllers)
                throw new init_missing_call_to_load_controllers_1.default();
            if (!psychicApp.apiRoot)
                throw new init_missing_api_root_1.default();
            if (!psychicApp.routesCb)
                throw new init_missing_routes_callback_1.default();
            await psychicApp.inflections?.();
            dreamApp.set('projectRoot', psychicApp.apiRoot);
            (0, cache_1.cachePsychicApplication)(psychicApp);
        });
        return psychicApp;
    }
    /**
     * Returns the cached psychic application if it has been set.
     * If it has not been set, an exception is raised.
     *
     * The psychic application can be set by calling PsychicApplication#init
     */
    static getOrFail() {
        return (0, cache_1.getCachedPsychicApplicationOrFail)();
    }
    static async loadControllers(controllersPath) {
        return await (0, loadControllers_1.default)(controllersPath);
    }
    get authSessionKey() {
        return (0, envValue_1.default)('AUTH_SESSION_KEY') || 'auth_session';
    }
    get controllers() {
        return (0, loadControllers_1.getControllersOrFail)();
    }
    async load(resourceType, resourcePath) {
        switch (resourceType) {
            case 'controllers':
                await (0, loadControllers_1.default)(resourcePath);
                this.loadedControllers = true;
                break;
        }
    }
    async boot(force = false) {
        if (this.booted && !force)
            return;
        // await new IntegrityChecker().check()
        await this.runHooksFor('load');
        switch ((0, envValue_1.default)('NODE_ENV')) {
            case 'development':
                await this.runHooksFor('load:dev');
                break;
            case 'production':
                await this.runHooksFor('load:prod');
                break;
            case 'test':
                await this.runHooksFor('load:test');
                break;
        }
        await this.inflections?.();
        this.booted = true;
    }
    on(hookEventType, cb) {
        switch (hookEventType) {
            case 'server:error':
                this.specialHooks.serverError.push(cb);
                break;
            case 'server:init':
                this.specialHooks.expressInit.push(cb);
                break;
            case 'ws:start':
                this.specialHooks.wsStart.push(cb);
                break;
            case 'ws:connect':
                this.specialHooks.wsConnect.push(cb);
                break;
            case 'after:routes':
                this.specialHooks['after:routes'].push(cb);
                break;
            default:
                this.bootHooks[hookEventType].push(cb);
        }
    }
    set(option, value) {
        switch (option) {
            case 'apiRoot':
                this.apiRoot = value;
                break;
            case 'clientRoot':
                this.clientRoot = value;
                break;
            case 'cors':
                this.corsOptions = { ...this.corsOptions, ...value };
                break;
            case 'cookie':
                this.cookieOptions = {
                    ...this.cookieOptions,
                    maxAge: (0, cookieMaxAgeFromCookieOpts_1.default)(value.maxAge),
                };
                break;
            case 'client':
                this.client = { ...this.client, ...value };
                break;
            case 'routes':
                this.routesCb = value;
                break;
            case 'json':
                this.jsonOptions = { ...this.jsonOptions, ...value };
                break;
            case 'background:queue':
                this.backgroundQueueOptions = {
                    ...this.backgroundQueueOptions,
                    ...value,
                };
                break;
            case 'background:worker':
                this.backgroundWorkerOptions = { ...this.backgroundWorkerOptions, ...value };
                break;
            case 'redis:background':
                this.redisBackgroundJobCredentials = {
                    ...this.redisBackgroundJobCredentials,
                    ...value,
                };
                break;
            case 'redis:ws':
                this.redisWsCredentials = { ...this.redisWsCredentials, ...value };
                break;
            case 'ssl':
                this.sslCredentials = { ...this.sslCredentials, ...value };
                break;
            case 'saltRounds':
                this.saltRounds = value;
                break;
            case 'openapi':
                this.openapi = { ...this.openapi, ...value };
                break;
            case 'paths':
                this.paths = {
                    ...this.paths,
                    ...value,
                };
                break;
            case 'inflections':
                this.inflections = value;
                break;
            default:
                throw new Error(`Unhandled option type passed to PsychicApplication#set: ${option}`);
        }
    }
    async runHooksFor(hookEventType) {
        for (const hook of this.bootHooks[hookEventType]) {
            await hook(this);
        }
    }
}
exports.default = PsychicApplication;
