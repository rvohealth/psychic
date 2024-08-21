"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientApiFileName = exports.writeFile = exports.loadFile = void 0;
const fs_1 = require("fs");
const psychic_application_1 = __importDefault(require("../psychic-application"));
async function loadFile(filepath) {
    return await fs_1.promises.readFile(filepath);
}
exports.loadFile = loadFile;
async function writeFile(filepath, contents) {
    return await fs_1.promises.writeFile(filepath, contents);
}
exports.writeFile = writeFile;
async function clientApiFileName() {
    const psychicApp = psychic_application_1.default.getOrFail();
    return await new Promise(accept => accept(psychicApp.openapi?.clientOutputFilename || 'client/src/api/schema.ts'));
}
exports.clientApiFileName = clientApiFileName;
