"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dream_1 = require("@rvohealth/dream");
const dotenv_1 = __importDefault(require("dotenv"));
if (process.env.PSYCHIC_CORE_DEVELOPMENT === '1') {
    const dotenvpath = (0, dream_1.testEnv)() ? __dirname + '/../../../.env.test' : __dirname + '/../../../.env';
    dotenv_1.default.config({ path: dotenvpath });
}
else {
    dotenv_1.default.config({
        path: (0, dream_1.testEnv)() ? '../../../.env.test' : '../../../.env',
    });
}
