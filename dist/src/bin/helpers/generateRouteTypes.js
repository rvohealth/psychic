"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dream_1 = require("@rvohealth/dream");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const psychic_application_1 = __importDefault(require("../../psychic-application"));
async function generateRouteTypes(routes) {
    const fileStr = `\
  export type RouteTypes =
  ${(0, dream_1.uniq)(routes.map(routeConf => `  | '/${routeConf.path.replace(/^\//, '')}'`)).join('\n')}
  `;
    const psychicApp = psychic_application_1.default.getOrFail();
    const routeTypesPath = path_1.default.join(psychicApp.apiRoot, 'src/conf/routeTypes.ts');
    await promises_1.default.writeFile(routeTypesPath, fileStr);
}
exports.default = generateRouteTypes;
