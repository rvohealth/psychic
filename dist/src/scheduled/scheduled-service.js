"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dream_1 = require("@rvohealth/dream");
const background_1 = __importDefault(require("../background"));
function scheduledService(priority = 'not_urgent') {
    return class ScheduledService {
        static get globalName() {
            if (!this._globalName)
                throw new dream_1.GlobalNameNotSet(this);
            return this._globalName;
        }
        static setGlobalName(globalName) {
            this._globalName = globalName;
        }
        static async schedule(pattern, methodName, 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...args) {
            return await background_1.default.scheduledMethod(this, pattern, methodName, {
                globalName: this.globalName,
                args,
                priority,
            });
        }
    };
}
exports.default = scheduledService;
