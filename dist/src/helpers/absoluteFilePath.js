"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// trying to standardize on a single way of importing files based on
// if DREAM_CORE_DEVELOPMENT=1. Currently, we do it several ways, but this
// would be the most stable moving forward, especially if we ever decide to
// build to dist, since directory structures morph in those contexts.
const path_1 = __importDefault(require("path"));
const psychic_application_1 = __importDefault(require("../psychic-application"));
const envValue_1 = require("./envValue");
function absoluteFilePath(filePath, { purgeTestAppInCoreDevelopment = false } = {}) {
    const psychicApp = psychic_application_1.default.getOrFail();
    let apiRoot = psychicApp.apiRoot;
    if ((0, envValue_1.envBool)('PSYCHIC_CORE_DEVELOPMENT')) {
        filePath = filePath.replace(/^[/]?test-app/, '');
        if (purgeTestAppInCoreDevelopment) {
            apiRoot = apiRoot.replace(/\/test-app/, '');
        }
    }
    return path_1.default.join(apiRoot, filePath.replace(/^\/src/, ''));
}
exports.default = absoluteFilePath;
