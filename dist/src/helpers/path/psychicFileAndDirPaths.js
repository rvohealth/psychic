"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const psychic_application_1 = __importDefault(require("../../psychic-application"));
function default_1(relDirPath, partialFilePath) {
    const psychicApp = psychic_application_1.default.getOrFail();
    const relFilePath = path_1.default.join(relDirPath, partialFilePath);
    const absFilePath = path_1.default.join(psychicApp.apiRoot, relFilePath);
    const absDirPath = absFilePath.replace(/\/[^/]+$/, '');
    return {
        relFilePath,
        absDirPath,
        absFilePath,
    };
}
exports.default = default_1;
