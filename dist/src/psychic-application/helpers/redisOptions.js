"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = __importDefault(require(".."));
function redisOptions(purpose) {
    const psychicApp = __1.default.getOrFail();
    switch (purpose) {
        case 'ws':
            return psychicApp.redisWsCredentials;
        case 'background_jobs':
            return psychicApp.redisBackgroundJobCredentials;
        default:
            throw new Error(`unexpected redis purpose encountered: ${purpose}`);
    }
}
exports.default = redisOptions;
