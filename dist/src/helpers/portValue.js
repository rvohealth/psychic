"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const psychic_application_1 = __importDefault(require("../psychic-application"));
const envValue_1 = require("./envValue");
function portValue() {
    const psychicApp = psychic_application_1.default.getOrFail();
    return psychicApp.port || (0, envValue_1.envInt)('PORT') || 7777;
}
exports.default = portValue;
