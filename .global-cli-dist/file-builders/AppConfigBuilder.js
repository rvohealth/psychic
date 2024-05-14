"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
class AppConfigBuilder {
    static async build(opts) {
        const contents = (await promises_1.default.readFile(path_1.default.join(__dirname, '..', '..', 'boilerplate', 'api', 'src', 'conf', 'app.ts'))).toString();
        return contents
            .replace('<BACKGROUND_CONNECT>', opts.userOptions.redis ? 'await background.connect()' : '// await background.connect()')
            .replace('<APP_NAME>', opts.appName)
            .replace('<API_ONLY>', opts.userOptions.apiOnly.toString())
            .replace('<USE_REDIS>', opts.userOptions.redis.toString())
            .replace('<USE_WS>', opts.userOptions.ws.toString());
    }
}
exports.default = AppConfigBuilder;
