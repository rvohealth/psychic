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
const dream_1 = require("@rvohealth/dream");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const envValue_1 = require("../helpers/envValue");
const openapiJsonPath_1 = __importDefault(require("../helpers/openapiJsonPath"));
const psychic_application_1 = __importDefault(require("../psychic-application"));
const types_1 = require("../router/types");
const defaults_1 = require("./defaults");
class OpenapiAppRenderer {
    /**
     * @internal
     *
     * reads the lates openapi builds using buildOpenapiObject, and syncs
     * the contents to the openapi.json file at the project root.
     */
    static async sync() {
        const openapiContents = await OpenapiAppRenderer.toObject();
        const jsonPath = (0, openapiJsonPath_1.default)();
        await promises_1.default.writeFile(jsonPath, JSON.stringify(openapiContents, null, 2), {
            flag: 'w+',
        });
    }
    /**
     * @internal
     *
     * builds a new typescript object which contains the combined
     * payloads of all `@Openapi` decorator calls used throughout
     * the controller layer.
     */
    static async toObject() {
        const processedSchemas = {};
        const psychicApp = psychic_application_1.default.getOrFail();
        const controllers = psychicApp.controllers;
        const packageJsonPath = path_1.default.join(psychicApp.apiRoot, 'package.json');
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const packageJson = (await Promise.resolve(`${packageJsonPath}`).then(s => __importStar(require(s)))).default;
        const finalOutput = {
            openapi: '3.0.2',
            info: {
                version: packageJson.version,
                title: packageJson.name,
                description: packageJson.description || 'The autogenerated openapi spec for your app',
            },
            paths: {},
            components: {
                ...(psychicApp.openapi?.defaults?.components || {}),
                schemas: {
                    ...defaults_1.DEFAULT_OPENAPI_COMPONENT_SCHEMAS,
                    ...(psychicApp.openapi?.defaults?.components?.schemas ||
                        {}),
                },
                responses: {
                    ...defaults_1.DEFAULT_OPENAPI_COMPONENT_RESPONSES,
                    ...(psychicApp.openapi?.defaults?.components?.responses || {}),
                },
            },
        };
        for (const controllerName of Object.keys(controllers)) {
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
            const controller = controllers[controllerName];
            for (const key of Object.keys(controller.openapi || {})) {
                if ((0, envValue_1.envBool)('DEBUG'))
                    console.log(`Processing OpenAPI key ${key} for controller ${controllerName}`);
                const renderer = controller.openapi[key];
                finalOutput.components.schemas = {
                    ...finalOutput.components.schemas,
                    ...renderer.toSchemaObject(processedSchemas),
                };
                const endpointPayload = await renderer.toPathObject(processedSchemas);
                // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
                const path = Object.keys(endpointPayload)[0];
                const method = Object.keys(endpointPayload[path]).find(key => types_1.HttpMethods.includes(key));
                finalOutput.paths[path] ||= {
                    parameters: [],
                };
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
                const pathObj = finalOutput.paths[path];
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
                pathObj[method] = endpointPayload[path][method];
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                pathObj.parameters = (0, dream_1.uniq)([
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                    ...(pathObj.parameters || []),
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
                    ...(endpointPayload[path]?.['parameters'] || []),
                ], 
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                (a, b) => a.name === b.name);
            }
        }
        return this.sortedSchemaPayload(finalOutput);
    }
    static sortedSchemaPayload(schema) {
        const sortedPaths = Object.keys(schema.paths).sort();
        const sortedSchemas = Object.keys(schema.components.schemas).sort();
        const sortedSchema = { ...schema };
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        sortedSchema.paths = sortedPaths.reduce((agg, path) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            agg[path] = schema.paths[path];
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return agg;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }, {});
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        sortedSchema.components.schemas = sortedSchemas.reduce((agg, key) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            agg[key] = schema.components.schemas[key];
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return agg;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }, {});
        return sortedSchema;
    }
}
exports.default = OpenapiAppRenderer;
