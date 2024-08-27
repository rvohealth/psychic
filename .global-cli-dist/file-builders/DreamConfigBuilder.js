"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
class DreamConfigBuilder {
    static async build(opts) {
        const contents = (await promises_1.default.readFile(path_1.default.join(__dirname, '..', '..', 'boilerplate', 'api', 'src', 'conf', 'dream.ts'))).toString();
        return contents.replace('<PRIMARY_KEY_TYPE>', `'${opts.userOptions.primaryKeyType || 'bigserial'}'`);
    }
}
exports.default = DreamConfigBuilder;
