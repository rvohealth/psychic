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
const redis_adapter_1 = require("@socket.io/redis-adapter");
const colors = __importStar(require("colorette"));
const redis_1 = require("redis");
const socket_io_1 = __importDefault(require("socket.io"));
const log_1 = __importDefault(require("../log"));
const startPsychicServer_1 = require("../server/helpers/startPsychicServer");
const envValue_1 = require("../helpers/envValue");
class Cable {
    constructor(app, config) {
        this.app = app;
        this.config = config;
    }
    connect() {
        if (this.io)
            return;
        // for socket.io, we have to circumvent the normal process for starting a
        // psychic server so that we can bind socket.io to the http instance.
        this.http = (0, startPsychicServer_1.getPsychicHttpInstance)(this.app, this.config.sslCredentials);
        this.io = new socket_io_1.default.Server(this.http, { cors: this.config.corsOptions });
        this.useRedis = this.config.useRedis;
    }
    async start(port = process.env.PORT || 7777, { withFrontEndClient = false, frontEndPort = 3000, } = {}) {
        this.connect();
        for (const hook of this.config.specialHooks.wsStart) {
            await hook(this.io);
        }
        this.io.on('connect', async (socket) => {
            try {
                for (const hook of this.config.specialHooks.wsConnect) {
                    await hook(socket);
                }
            }
            catch (error) {
                if ((0, envValue_1.envBool)('PSYCHIC_DANGEROUSLY_PERMIT_WS_EXCEPTIONS'))
                    throw error;
                else {
                    console.error(`
            An exception was caught in your websocket thread.
            To prevent your server from crashing, we are rescuing this error here for you.
            If you would like us to raise this exception, make sure to set

            PSYCHIC_DANGEROUSLY_PERMIT_WS_EXCEPTIONS=1

            the error received is:

            ${error.message}
          `);
                    console.trace();
                }
            }
        });
        if (this.useRedis)
            await this.bindToRedis();
        await this.listen({ port: parseInt(port.toString()), withFrontEndClient, frontEndPort });
    }
    async listen({ port, withFrontEndClient, frontEndPort, }) {
        return new Promise(accept => {
            this.http.listen(port, () => {
                if (!(0, dream_1.testEnv)()) {
                    log_1.default.welcome();
                    log_1.default.puts('\n');
                    log_1.default.puts(colors.cyan('socket server started                                      '));
                    log_1.default.puts(colors.cyan(`psychic dev server started at port ${colors.bgBlueBright(colors.green(port))}`));
                    if (withFrontEndClient)
                        log_1.default.puts(`client server started at port ${colors.cyan(frontEndPort)}`);
                    log_1.default.puts('\n');
                }
                accept(true);
            });
        });
    }
    async bindToRedis() {
        const userRedisCreds = this.config.redisWsCredentials;
        const creds = {
            username: userRedisCreds.username,
            password: userRedisCreds.password,
            socket: {
                host: userRedisCreds.host,
                port: userRedisCreds.port ? parseInt(userRedisCreds.port) : 6379,
                tls: (!!userRedisCreds.secure || undefined),
                rejectUnauthorized: !!userRedisCreds.secure,
            },
        };
        const pubClient = (0, redis_1.createClient)(creds);
        const subClient = pubClient.duplicate();
        pubClient.on('error', error => {
            console.log('PUB CLIENT ERROR', error);
        });
        subClient.on('error', error => {
            console.log('sub CLIENT ERROR', error);
        });
        try {
            await Promise.all([pubClient.connect(), subClient.connect()]);
        }
        catch (error) {
            console.log('REDIS CONNECT ERROR: ', error);
        }
        try {
            this.io.adapter((0, redis_adapter_1.createAdapter)(pubClient, subClient));
        }
        catch (error) {
            console.log('FAILED TO ADAPT', error);
        }
    }
}
exports.default = Cable;
