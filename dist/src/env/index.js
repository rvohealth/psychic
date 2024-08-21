"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dream_1 = require("@rvohealth/dream");
const dotenv_1 = __importDefault(require("dotenv"));
class Env {
    constructor() {
        this.loaded = false;
    }
    load() {
        if (this.loaded)
            return;
        dotenv_1.default.config({ path: (0, dream_1.testEnv)() ? '.env.test' : '.env' });
        this.check();
    }
    ensureLoaded() {
        if (!this.loaded)
            this.load();
    }
    check() {
        // const missingEnvs: string[] = []
        // if (!process.env.APP_ENCRYPTION_KEY) missingEnvs.push('APP_ENCRYPTION_KEY')
        //
        // if (!!missingEnvs.length)
        //   throw `Must make sure the following env vars are set before starting the psychic server: \n${missingEnvs.join(",\n  ")}`
    }
}
const env = new Env();
exports.default = env;
