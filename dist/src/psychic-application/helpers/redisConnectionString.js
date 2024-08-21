"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const redisOptions_1 = __importDefault(require("./redisOptions"));
function redisConnectionString(purpose) {
    const connectionOptions = (0, redisOptions_1.default)(purpose);
    const protocol = connectionOptions.secure ? 'rediss' : 'redis';
    const user = connectionOptions.username || '';
    const password = connectionOptions.password || '';
    const host = connectionOptions.host || 'localhost';
    const port = connectionOptions.port || 6379;
    if (user && password) {
        return `${protocol}://${user}:${password}@${host}:${port}`;
    }
    else if (user) {
        return `${protocol}://${user}@${host}:${port}`;
    }
    else {
        return `${protocol}://${host}:${port}`;
    }
}
exports.default = redisConnectionString;
