"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.maybeSyncRoutes = void 0;
const sspawn_1 = __importDefault(require("./sspawn"));
const developmentOrTestEnv_1 = __importDefault(require("./developmentOrTestEnv"));
const nodeOrTsnodeCmd_1 = __importDefault(require("./nodeOrTsnodeCmd"));
async function maybeSyncRoutes(args) {
    if ((0, developmentOrTestEnv_1.default)()) {
        await syncRoutes(args);
    }
}
exports.maybeSyncRoutes = maybeSyncRoutes;
async function syncRoutes(args) {
    await (0, sspawn_1.default)((0, nodeOrTsnodeCmd_1.default)('src/bin/sync-routes.ts', args, { tsnodeFlags: ['--transpile-only'] }));
}
exports.default = syncRoutes;
