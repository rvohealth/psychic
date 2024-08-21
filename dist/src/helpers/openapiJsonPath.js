"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const psychic_application_1 = __importDefault(require("../psychic-application"));
function openapiJsonPath() {
    const psychicApp = psychic_application_1.default.getOrFail();
    return path_1.default.join(psychicApp.apiRoot, psychicApp.openapi.outputFilename);
}
exports.default = openapiJsonPath;
