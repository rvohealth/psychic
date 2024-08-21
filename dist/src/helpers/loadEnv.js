"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dream_1 = require("@rvohealth/dream");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: (0, dream_1.testEnv)() ? '.env.test' : '.env' });
