"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const pluralize_1 = __importDefault(require("pluralize"));
const dreamjsOrDreamtsCmd_1 = __importDefault(require("../../boot/cli/helpers/dreamjsOrDreamtsCmd"));
const omitCoreArg_1 = __importDefault(require("../../boot/cli/helpers/omitCoreArg"));
const sspawn_1 = __importDefault(require("../helpers/sspawn"));
const psychic_application_1 = __importDefault(require("../psychic-application"));
const apiModule_1 = __importDefault(require("./client/apiModule"));
const controller_1 = __importDefault(require("./controller"));
async function generateResource(route, fullyQualifiedModelName, args) {
    const psychicApp = psychic_application_1.default.getOrFail();
    const attributesWithTypes = args.filter(attr => !/^--/.test(attr));
    await (0, sspawn_1.default)((0, dreamjsOrDreamtsCmd_1.default)(`g:model ${fullyQualifiedModelName} ${attributesWithTypes.join(' ')}`, (0, omitCoreArg_1.default)(args)));
    if (args.includes('--core')) {
        console.log('--core argument provided, setting now');
        process.env.PSYCHIC_CORE_DEVELOPMENT = '1';
    }
    await (0, controller_1.default)(route, fullyQualifiedModelName, ['create', 'index', 'show', 'update', 'destroy']);
    if (!psychicApp?.apiOnly) {
        const psychicApp = psychic_application_1.default.getOrFail();
        const str = (0, apiModule_1.default)(route, fullyQualifiedModelName);
        const filepath = path_1.default.join(psychicApp.clientRoot, psychicApp.client.apiPath, psychicApp.openapi.clientOutputFilename, (0, pluralize_1.default)(fullyQualifiedModelName.toLowerCase()) + '.ts');
        const pathParts = filepath.split('/');
        pathParts.pop();
        await fs.mkdir(pathParts.join('/'), { recursive: true });
        await fs.writeFile(filepath, str);
        console.log(`generating client api module: ${filepath}`);
    }
    // if (process.env.NODE_ENV !== 'test') process.exit()
}
exports.default = generateResource;
