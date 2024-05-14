"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const generateEncryptionKey_1 = __importDefault(require("../helpers/generateEncryptionKey"));
class EnvBuilder {
    static build({ env, appName }) {
        return `\
DB_USER=
DB_NAME=${snakeify(appName)}_${env}
DB_PORT=5432
DB_HOST=localhost
APP_ENCRYPTION_KEY='${(0, generateEncryptionKey_1.default)()}'
TZ=UTC
`;
    }
}
exports.default = EnvBuilder;
// TODO: import from shared space. The version within dream contains the most robust variant of snakeify,
// though we don't really use it for anything other than string transformations, so this version has been simplified.
function snakeify(str) {
    return str
        .replace(/(?:^|\.?)([A-Z])/g, (_, y) => '_' + y.toLowerCase())
        .replace(/^_/, '')
        .replace(/\//g, '_')
        .replace(/-/g, '_')
        .toLowerCase();
}
