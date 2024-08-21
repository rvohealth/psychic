"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = require("redis");
const redisOptions_1 = __importDefault(require("../psychic-application/helpers/redisOptions"));
let redisWsClientCache = null;
async function createWsRedisClient() {
    if (redisWsClientCache)
        return redisWsClientCache;
    const redisOpts = (0, redisOptions_1.default)('ws');
    const creds = {
        username: redisOpts.username,
        password: redisOpts.password,
        socket: {
            host: redisOpts.host,
            port: redisOpts.port ? parseInt(redisOpts.port) : 6379,
            tls: (!!redisOpts.secure || undefined),
            rejectUnauthorized: !!redisOpts.secure,
        },
    };
    const client = (0, redis_1.createClient)(creds);
    redisWsClientCache = client;
    await client.connect();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any
    return client;
}
exports.default = createWsRedisClient;
