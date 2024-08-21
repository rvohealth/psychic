"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const controller_1 = __importDefault(require("../generate/controller"));
const resource_1 = __importDefault(require("../generate/resource"));
const openapiJsonPath_1 = __importDefault(require("../helpers/openapiJsonPath"));
const sspawn_1 = __importDefault(require("../helpers/sspawn"));
const app_1 = __importDefault(require("../openapi-renderer/app"));
const psychic_application_1 = __importDefault(require("../psychic-application"));
const server_1 = __importDefault(require("../server"));
const generateRouteTypes_1 = __importDefault(require("./helpers/generateRouteTypes"));
const printRoutes_1 = __importDefault(require("./helpers/printRoutes"));
class PsychicBin {
    static async generateController() {
        const route = process.argv[3];
        const name = process.argv[4];
        const indexOfTsNode = process.argv.findIndex(str => str === '--tsnode');
        const methods = indexOfTsNode ? process.argv.slice(5, indexOfTsNode) : process.argv.slice(5);
        await (0, controller_1.default)(route, name, methods.filter(method => !['--core'].includes(method)));
    }
    static async generateResource() {
        const route = process.argv[3];
        const name = process.argv[4];
        const indexOfTsNode = process.argv.findIndex(str => str === '--tsnode');
        const args = indexOfTsNode ? process.argv.slice(5, indexOfTsNode) : process.argv.slice(5);
        await (0, resource_1.default)(route, name, args);
    }
    static async routes() {
        await (0, printRoutes_1.default)();
    }
    static async syncOpenapiJson() {
        console.log(`syncing ${(0, openapiJsonPath_1.default)()}...`);
        await app_1.default.sync();
        console.log(`done syncing ${(0, openapiJsonPath_1.default)()}!`);
    }
    static async syncRoutes() {
        console.log('syncing routes...');
        const server = new server_1.default();
        await server.boot();
        const routes = await server.routes();
        await (0, generateRouteTypes_1.default)(routes);
        console.log('done syncing routes!');
    }
    static async syncOpenapiClientSchema() {
        console.log('syncing client api schema...');
        const psychicApp = psychic_application_1.default.getOrFail();
        const apiPath = path_1.default.join(psychicApp.clientRoot, psychicApp.client.apiPath);
        const clientApiSchemaFilename = psychicApp.openapi?.clientOutputFilename;
        await (0, sspawn_1.default)(`npx openapi-typescript ${psychicApp.apiRoot}/openapi.json -o ${apiPath}/${clientApiSchemaFilename}`);
        console.log('done syncing client api schema!');
    }
}
exports.default = PsychicBin;
