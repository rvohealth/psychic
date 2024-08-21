"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidWsPathError = void 0;
const luxon_1 = require("luxon");
const dream_1 = require("@rvohealth/dream");
const redis_emitter_1 = require("@socket.io/redis-emitter");
const createWsRedisClient_1 = __importDefault(require("./createWsRedisClient"));
const redisWsKey_1 = __importDefault(require("./redisWsKey"));
class Ws {
    static async register(socket, id, redisKeyPrefix = 'user') {
        const redisClient = await (0, createWsRedisClient_1.default)();
        const interpretedId = id?.isDreamInstance ? id.primaryKeyValue : id;
        const key = (0, redisWsKey_1.default)(interpretedId, redisKeyPrefix);
        const socketIdsToKeep = await redisClient.lRange((0, redisWsKey_1.default)(interpretedId, redisKeyPrefix), -2, -1);
        await redisClient
            .multi()
            .del(key)
            .rPush(key, [...socketIdsToKeep, socket.id])
            .expireAt(key, 
        // TODO: make this configurable in non-test environments
        luxon_1.DateTime.now()
            .plus((0, dream_1.testEnv)() ? { seconds: 15 } : { day: 1 })
            .toJSDate())
            .exec();
        socket.on('disconnect', async () => {
            await redisClient.lRem(key, 1, socket.id);
        });
        const ws = new Ws(['/ops/connection-success']);
        await ws.emit(interpretedId, '/ops/connection-success', {
            message: 'Successfully connected to psychic websockets',
        });
    }
    constructor(allowedPaths, { namespace = '/', redisKeyPrefix = 'user', } = {}) {
        this.allowedPaths = allowedPaths;
        this.booted = false;
        this.namespace = namespace;
        this.redisKeyPrefix = redisKeyPrefix;
    }
    async boot() {
        if (this.booted)
            return;
        this.redisClient = await (0, createWsRedisClient_1.default)();
        this.io = new redis_emitter_1.Emitter(this.redisClient).of(this.namespace);
        this.booted = true;
    }
    async emit(id, path, 
    // eslint-disable-next-line
    data = {}) {
        if (this.allowedPaths.length && !this.allowedPaths.includes(path))
            throw new InvalidWsPathError(path);
        await this.boot();
        const socketIds = await this.findSocketIds(id?.isDreamInstance ? id.primaryKeyValue : id);
        for (const socketId of socketIds) {
            this.io.to(socketId).emit(path, data);
        }
    }
    async findSocketIds(id) {
        await this.boot();
        return (0, dream_1.uniq)(await this.redisClient.lRange(this.redisKey(id), 0, -1));
    }
    redisKey(userId) {
        return (0, redisWsKey_1.default)(userId, this.redisKeyPrefix);
    }
}
exports.default = Ws;
class InvalidWsPathError extends Error {
    constructor(invalidPath) {
        super();
        this.invalidPath = invalidPath;
    }
    get message() {
        return `
      Invalid path passed to Ws: "${this.invalidPath}"
    `;
    }
}
exports.InvalidWsPathError = InvalidWsPathError;
