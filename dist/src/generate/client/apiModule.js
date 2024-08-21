"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dream_1 = require("@rvohealth/dream");
const pluralize_1 = __importDefault(require("pluralize"));
const updirs_1 = __importDefault(require("../helpers/updirs"));
function generateClientAPIModule(route, modelName) {
    const pluralizedName = (0, pluralize_1.default)(modelName);
    const pascalizedName = (0, dream_1.pascalize)(pluralizedName).replace(/\//g, '') + 'API';
    const dotRoute = route.replace(/^\//, '').replace(/\//g, '.');
    return `\
import { apiCall } from '${(0, updirs_1.default)(modelName.split('/').length - 1)}common'
import { User } from '${(0, updirs_1.default)(modelName.split('/').length - 1)}schema'

export default class ${pascalizedName} {
  public static index() {
    return apiCall('${dotRoute.toLocaleLowerCase()}.GET').send()
  }

  public static create(body: Partial<User>) {
    return apiCall('${dotRoute.toLocaleLowerCase()}.POST').send({ body })
  }

  public static show(id: string) {
    return apiCall('${dotRoute.toLocaleLowerCase()}.id.GET', { id }).send()
  }

  public static update(id: string, body: Partial<User>) {
    return apiCall('${dotRoute.toLocaleLowerCase()}.id.PATCH', { id }).send({ body })
  }

  public static destroy(id: string) {
    return apiCall('${dotRoute.toLocaleLowerCase()}.id.DELETE', { id }).send()
  }
}`;
}
exports.default = generateClientAPIModule;
