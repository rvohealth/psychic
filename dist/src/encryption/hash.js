"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dream_1 = require("@rvohealth/dream");
const bcrypt_1 = __importDefault(require("bcrypt"));
const psychic_application_1 = __importDefault(require("../psychic-application"));
class Hash {
    static get saltRounds() {
        const psychicApp = psychic_application_1.default.getOrFail();
        return psychicApp.saltRounds || ((0, dream_1.testEnv)() ? 4 : 11);
    }
    static async gen(plaintext) {
        return await bcrypt_1.default.hash(plaintext, this.saltRounds);
    }
    static async check(plaintext, hash) {
        if (!plaintext)
            return false;
        return await bcrypt_1.default.compare(plaintext, hash);
    }
}
exports.default = Hash;
