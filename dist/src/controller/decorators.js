"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAPI = exports.BeforeAction = void 0;
const endpoint_1 = __importDefault(require("../openapi-renderer/endpoint"));
const hooks_1 = require("./hooks");
function BeforeAction(opts = {}) {
    return function (target, methodName) {
        const psychicControllerClass = target.constructor;
        if (!Object.getOwnPropertyDescriptor(psychicControllerClass, 'controllerHooks'))
            psychicControllerClass.controllerHooks = [...psychicControllerClass.controllerHooks];
        psychicControllerClass.controllerHooks.push(new hooks_1.ControllerHook(psychicControllerClass.name, methodName.toString(), opts));
    };
}
exports.BeforeAction = BeforeAction;
/**
 * Used to annotate your controller method in a way that enables
 * Psychic to automatically generate an openapi spec for you. Using
 * this feature, you can easily document your api in typescript, taking
 * advantage of powerful type completion and validation, as well as useful
 * shorthand notation to keep annotations simple when possible.
 *
 * @param modelOrSerializer - a function which immediately returns either a serializer class, a dream model class, or else something that has a serializers getter on it.
 * @param body - Optional. The shape of the request body
 * @param headers - Optional. The list of request headers to provide for this endpoint
 * @param many - Optional. whether or not to render a top level array for this serializer
 * @param method - The HTTP method to use when hitting this endpoint
 * @param path - Optional. If passed, this path will be used as the request path. If not, it will be looked up in the conf/routes.ts file.
 * @param query - Optional. A list of query params to provide for this endpoint
 * @param responses - Optional. A list of additional responses that your app may return
 * @param serializerKey - Optional. Use this to override the serializer key to use when looking up a serializer by the provided model or view model.
 * @param status - Optional. The status code this endpoint uses when responding successfully. If not passed, 200 is assummed.
 * @param tags - Optional. string array
 * @param uri - Optional. A list of uri segments that this endpoint uses
 */
function OpenAPI(modelOrSerializer, opts) {
    return function (target, methodName) {
        const psychicControllerClass = target.constructor;
        if (!Object.getOwnPropertyDescriptor(psychicControllerClass, 'openapi'))
            psychicControllerClass.openapi = {};
        if (opts) {
            psychicControllerClass.openapi[methodName.toString()] = new endpoint_1.default(modelOrSerializer, psychicControllerClass, methodName.toString(), opts);
        }
        else {
            if (isSerializable(modelOrSerializer)) {
                psychicControllerClass.openapi[methodName.toString()] = new endpoint_1.default(modelOrSerializer, psychicControllerClass, methodName.toString(), undefined);
            }
            else {
                psychicControllerClass.openapi[methodName.toString()] = new endpoint_1.default(null, psychicControllerClass, methodName.toString(), modelOrSerializer);
            }
        }
    };
}
exports.OpenAPI = OpenAPI;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isSerializable(dreamOrSerializerClass) {
    return (Array.isArray(dreamOrSerializerClass) ||
        hasSerializersGetter(dreamOrSerializerClass) ||
        !!dreamOrSerializerClass?.isDreamSerializer);
}
function hasSerializersGetter(dreamOrSerializerClass) {
    try {
        return !!dreamOrSerializerClass?.prototype?.serializers;
    }
    catch {
        return false;
    }
}
