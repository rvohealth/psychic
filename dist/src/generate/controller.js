"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const psychic_support_helpers_1 = require("@rvohealth/dream/psychic-support-helpers");
const promises_1 = __importDefault(require("fs/promises"));
const pluralize_1 = __importDefault(require("pluralize"));
const psychicFileAndDirPaths_1 = __importDefault(require("../helpers/path/psychicFileAndDirPaths"));
const psychicPath_1 = __importDefault(require("../helpers/path/psychicPath"));
const generateControllerContent_1 = __importDefault(require("./helpers/generateControllerContent"));
const generateControllerSpecContent_1 = __importDefault(require("./helpers/generateControllerSpecContent"));
async function generateController(route, fullyQualifiedModelName, methods) {
    fullyQualifiedModelName = (0, psychic_support_helpers_1.standardizeFullyQualifiedModelName)(fullyQualifiedModelName);
    const fullyQualifiedControllerName = `${(0, pluralize_1.default)(fullyQualifiedModelName)}Controller`;
    const { relFilePath, absDirPath, absFilePath } = (0, psychicFileAndDirPaths_1.default)((0, psychicPath_1.default)('controllers'), fullyQualifiedControllerName + `.ts`);
    try {
        console.log(`generating controller: ${relFilePath}`);
        await promises_1.default.mkdir(absDirPath, { recursive: true });
        await promises_1.default.writeFile(absFilePath, (0, generateControllerContent_1.default)(fullyQualifiedControllerName, route, fullyQualifiedModelName, methods));
    }
    catch (error) {
        throw new Error(`
      Something happened while trying to create the controller file:
        ${relFilePath}

      Does this file already exist? Here is the error that was raised:
        ${error.message}
    `);
    }
    await generateControllerSpec(fullyQualifiedControllerName); //, route, fullyQualifiedModelName, methods)
}
exports.default = generateController;
async function generateControllerSpec(fullyQualifiedControllerName) {
    const { relFilePath, absDirPath, absFilePath } = (0, psychicFileAndDirPaths_1.default)((0, psychicPath_1.default)('controllerSpecs'), fullyQualifiedControllerName + `.spec.ts`);
    try {
        console.log(`generating controller: ${relFilePath}`);
        await promises_1.default.mkdir(absDirPath, { recursive: true });
        await promises_1.default.writeFile(absFilePath, (0, generateControllerSpecContent_1.default)(fullyQualifiedControllerName));
    }
    catch (error) {
        throw new Error(`
      Something happened while trying to create the controller spec file:
        ${relFilePath}

      Does this file already exist? Here is the error that was raised:
        ${error.message}
    `);
    }
}
