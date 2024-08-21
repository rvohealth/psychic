"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const invalid_app_encryption_key_1 = __importDefault(require("../error/encrypt/invalid-app-encryption-key"));
const psychic_application_1 = __importDefault(require("../psychic-application"));
class Encrypt {
    static sign(data) {
        try {
            const psychicApp = psychic_application_1.default.getOrFail();
            return jsonwebtoken_1.default.sign(data, psychicApp.encryptionKey);
        }
        catch (_) {
            const err = new invalid_app_encryption_key_1.default();
            // intentionally doing a manual console.log here to ensure that
            // this shows up in circleci, since this error is otherwise fairly hard to track down
            console.log(err.message);
            throw err;
        }
    }
    static decode(encrypted) {
        try {
            const psychicApp = psychic_application_1.default.getOrFail();
            const payload = jsonwebtoken_1.default.verify(encrypted, psychicApp.encryptionKey);
            return payload;
        }
        catch (err) {
            return null;
        }
    }
}
exports.default = Encrypt;
