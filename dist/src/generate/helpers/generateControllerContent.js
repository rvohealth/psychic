"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dream_1 = require("@rvohealth/dream");
const dream_2 = require("@rvohealth/dream");
const pluralize_1 = __importDefault(require("pluralize"));
const relativePsychicPath_1 = __importDefault(require("../../helpers/path/relativePsychicPath"));
function generateControllerContent(fullyQualifiedControllerName, route, fullyQualifiedModelName, methods = []) {
    fullyQualifiedControllerName = (0, dream_2.standardizeFullyQualifiedModelName)(fullyQualifiedControllerName);
    const additionalImports = [];
    const controllerClassName = (0, dream_2.globalClassNameFromFullyQualifiedModelName)(fullyQualifiedControllerName);
    let extendingClassName = 'AuthedController';
    if (/^\/{0,1}admin\/.*/.test(route)) {
        additionalImports.push(`import AdminAuthedController from '${routeDepthToRelativePath(route, 1)}/Admin/AuthedController'`);
        extendingClassName = 'AdminAuthedController';
    }
    else {
        additionalImports.push(`import AuthedController from '${routeDepthToRelativePath(route, 1)}/AuthedController'`);
    }
    let modelClassName;
    let modelAttributeName;
    if (fullyQualifiedModelName) {
        fullyQualifiedModelName = (0, dream_2.standardizeFullyQualifiedModelName)(fullyQualifiedModelName);
        modelClassName = (0, dream_2.globalClassNameFromFullyQualifiedModelName)(fullyQualifiedModelName);
        modelAttributeName = (0, dream_1.camelize)(modelClassName);
        additionalImports.push(importStatementForModel(fullyQualifiedControllerName, fullyQualifiedModelName));
    }
    const methodDefs = methods.map(methodName => {
        switch (methodName) {
            case 'create':
                if (modelAttributeName)
                    return `\
  @OpenAPI(${modelClassName}, { status: 201 })
  public async create() {
    //    const ${modelAttributeName} = await this.currentUser.createAssociation('${(0, pluralize_1.default)(modelAttributeName)}', this.paramsFor(${modelClassName}))
    //    this.created(${modelAttributeName})
  }`;
                else
                    return `\
  public async create() {
  }`;
            case 'index':
                if (modelAttributeName)
                    return `\
  @OpenAPI(${modelClassName}, {
    status: 200,
    many: true,
    serializerKey: 'summary',
  })
  public async index() {
    //    const ${(0, pluralize_1.default)(modelAttributeName)} = await this.currentUser.associationQuery('${(0, pluralize_1.default)(modelAttributeName)}').all()
    //    this.ok(${(0, pluralize_1.default)(modelAttributeName)})
  }`;
                else
                    return `\
  @OpenAPI({
    response: {
      200: {
        // add openapi definition for your custom endpoint
      }
    }
  })
  public async index() {
  }`;
            case 'show':
                if (modelAttributeName)
                    return `\
  @OpenAPI(${modelClassName}, { status: 200 })
  public async show() {
    //    const ${modelAttributeName} = await this.${modelAttributeName}()
    //    this.ok(${modelAttributeName})
  }`;
                else
                    return `\
  @OpenAPI({
    response: {
      200: {
        // add openapi definition for your custom endpoint
      }
    }
  })
  public async show() {
  }`;
            case 'update':
                if (modelAttributeName)
                    return `\
  @OpenAPI(${modelClassName}, { status: 204 })
  public async update() {
    //    const ${modelAttributeName} = await this.${modelAttributeName}()
    //    await ${modelAttributeName}.update(this.paramsFor(${modelClassName}))
    //    this.noContent()
  }`;
                else
                    return `\
  @OpenAPI({ status: 204 })
  public async update() {
  }`;
            case 'destroy':
                if (modelAttributeName)
                    return `\
  @OpenAPI({ status: 204 })
  public async destroy() {
    //    const ${modelAttributeName} = await this.${modelAttributeName}()
    //    await ${modelAttributeName}.destroy()
    //    this.noContent()
  }`;
                else
                    return `\
  @OpenAPI({ status: 204 })
  public async destroy() {
  }`;
            default:
                return `\
  @OpenAPI({
    response: {
      200: {
        // add openapi definition for your custom endpoint
      }
    }
  })
  public async ${methodName}() {
  }`;
        }
    });
    return `\
import { OpenAPI } from '@rvohealth/psychic'
${additionalImports.length ? additionalImports.join('\n') : ''}

export default class ${controllerClassName} extends ${extendingClassName} {
${methodDefs.join('\n\n')}${modelClassName ? privateMethods(modelClassName, methods) : ''}
}\
`;
}
exports.default = generateControllerContent;
function privateMethods(modelClassName, methods) {
    const privateMethods = [];
    if (methods.find(methodName => ['show', 'update', 'destroy'].includes(methodName)))
        privateMethods.push(loadModelStatement(modelClassName));
    if (!privateMethods.length)
        return '';
    return `\n${privateMethods.join('\n')}`;
}
function loadModelStatement(modelClassName) {
    return `
  private async ${(0, dream_1.camelize)(modelClassName)}() {
    return await this.currentUser.associationQuery('${(0, pluralize_1.default)((0, dream_1.camelize)(modelClassName))}').findOrFail(
      this.castParam('id', 'string')
    )
  }`;
}
function routeDepthToRelativePath(route, subtractFromDepth = 0) {
    const depth = route.replace(/^\//, '').split('/').length;
    return (Array(depth - subtractFromDepth)
        .fill('..')
        .join('/') || '.');
}
function importStatementForModel(originControllerName, destinationModelName) {
    return `import ${(0, dream_2.globalClassNameFromFullyQualifiedModelName)(destinationModelName)} from '${(0, relativePsychicPath_1.default)('controllers', 'models', originControllerName, destinationModelName)}'`;
}
