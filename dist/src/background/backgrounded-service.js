"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dream_1 = require("@rvohealth/dream");
const _1 = __importDefault(require("."));
function backgroundedService(priority = 'default') {
    return class BackgroundedService {
        static get globalName() {
            if (!this._globalName)
                throw new dream_1.GlobalNameNotSet(this);
            return this._globalName;
        }
        static setGlobalName(globalName) {
            this._globalName = globalName;
        }
        static async background(methodName, 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...args) {
            return await _1.default.staticMethod(this, methodName, {
                globalName: this.globalName,
                args,
                priority,
            });
        }
        async background(methodName, { args, constructorArgs, } = {}) {
            return await _1.default.instanceMethod(this.constructor, methodName, {
                globalName: this.constructor.globalName,
                args,
                constructorArgs,
                priority,
            });
        }
        static async backgroundWithDelay(delaySeconds, methodName, 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...args) {
            return await _1.default.staticMethod(this, methodName, {
                globalName: this.globalName,
                delaySeconds,
                args,
                priority,
            });
        }
        async backgroundWithDelay(delaySeconds, methodName, { args, constructorArgs, } = {}) {
            return await _1.default.instanceMethod(this.constructor, methodName, {
                globalName: this.constructor.globalName,
                delaySeconds,
                args,
                constructorArgs,
                priority,
            });
        }
    };
}
exports.default = backgroundedService;
