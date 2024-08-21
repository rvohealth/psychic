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
exports.controllerSerializerIndex = exports.ControllerSerializerIndex = exports.PsychicParamsPrimitiveLiterals = void 0;
const dream_1 = require("@rvohealth/dream");
const background_1 = __importDefault(require("../background"));
const bad_request_1 = __importDefault(require("../error/http/bad-request"));
const conflict_1 = __importDefault(require("../error/http/conflict"));
const forbidden_1 = __importDefault(require("../error/http/forbidden"));
const internal_server_error_1 = __importDefault(require("../error/http/internal-server-error"));
const not_found_1 = __importDefault(require("../error/http/not-found"));
const service_unavailable_1 = __importDefault(require("../error/http/service-unavailable"));
const status_codes_1 = __importDefault(require("../error/http/status-codes"));
const unauthorized_1 = __importDefault(require("../error/http/unauthorized"));
const unprocessable_entity_1 = __importDefault(require("../error/http/unprocessable-entity"));
const params_1 = __importStar(require("../server/params"));
const session_1 = __importDefault(require("../session"));
exports.PsychicParamsPrimitiveLiterals = [
    'bigint',
    'bigint[]',
    'boolean',
    'boolean[]',
    'date',
    'date[]',
    'datetime',
    'datetime[]',
    'integer',
    'integer[]',
    'json',
    'json[]',
    'null',
    'null[]',
    'number',
    'number[]',
    'string',
    'string[]',
    'uuid',
    'uuid[]',
];
class InvalidDotNotationPath extends Error {
}
class PsychicController {
    /**
     * @internal
     *
     * Used internally as a helpful distinguisher between controllers
     * and non-controllers
     */
    static get isPsychicController() {
        return true;
    }
    /**
     * Enables you to specify specific serializers to use
     * when encountering specific models, i.e.
     *
     * ```ts
     * class MyController extends AuthedController {
     *   static {
     *     this.serializes(User).with(UserCustomSerializer)
     *   }
     * }
     * ````
     */
    static serializes(ModelClass) {
        return {
            with: (SerializerClass) => {
                exports.controllerSerializerIndex.add(this, SerializerClass, ModelClass);
                return this;
            },
        };
    }
    /**
     * @internal
     *
     * Returns the global identifier for this particular controller.
     * When you first initialize your application, the controllers
     * you provide are organized into a map of key-value pairs,
     * where the keys are global identifiers for each controller, and
     * the values are the matching controllers. The key returned here
     * enables a lookup of the controller from the PsychicApplication
     * class.
     */
    static get globalName() {
        if (!this._globalName)
            throw new dream_1.GlobalNameNotSet(this);
        return this._globalName;
    }
    static setGlobalName(globalName) {
        this._globalName = globalName;
    }
    /**
     * @internal
     *
     * Returns a controller-action string which is used to signify both
     * the controller and the method to be called for a particular route.
     * For the controller "Api/V1/UsersController" and the method "show",
     * the controllerActionPath would return:
     *
     *   "Api/V1/Users#show"
     */
    static controllerActionPath(methodName) {
        return `${this.globalName.replace(/^controllers\//, '').replace(/Controller$/, '')}#${methodName.toString()}`;
    }
    /**
     * given a static method on this controller, it will call this method
     * in a background worker.
     *
     * @param args - a list of arguments to send into the method you are calling in the background.
     */
    static async background(methodName, 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...args) {
        return await background_1.default.staticMethod(this, methodName, {
            globalName: this.globalName,
            args,
        });
    }
    /**
     * given a static method on this controller, it will call this method
     * in a background worker, waiting the specified number of delaySeconds
     * before doing so.
     *
     * @param args - a list of arguments to send into the method you are calling in the background.
     */
    static async backgroundWithDelay(delaySeconds, methodName, 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...args) {
        return await background_1.default.staticMethod(this, methodName, {
            delaySeconds,
            globalName: this.globalName,
            args,
        });
    }
    /**
     * @internal
     *
     * Used internally as a helpful distinguisher between controllers
     * and non-controllers
     */
    get isPsychicControllerInstance() {
        return true;
    }
    constructor(req, res, { config, action, }) {
        this.defaultSerializerPassthrough = {};
        this.req = req;
        this.res = res;
        this.config = config;
        this.session = new session_1.default(req, res);
        this.action = action;
    }
    get params() {
        const params = {
            ...this.req.params,
            ...this.req.body,
            ...this.req.query,
        };
        return params;
    }
    param(key) {
        return this.params[key];
    }
    castParam(key, expectedType, opts) {
        try {
            return this._castParam(key.split('.'), this.params, expectedType, opts);
        }
        catch (error) {
            if (error instanceof InvalidDotNotationPath)
                throw new params_1.ParamValidationError(`Invalid dot notation in castParam: ${key}`);
            throw error;
        }
    }
    _castParam(keys, params, expectedType, opts) {
        const key = keys.shift();
        if (!keys.length)
            return params_1.default.cast(params[key], expectedType, opts);
        const nestedParams = params[key];
        if (nestedParams === undefined) {
            if (opts?.allowNull)
                return null;
            throw new InvalidDotNotationPath();
        }
        else if (Array.isArray(nestedParams)) {
            throw new InvalidDotNotationPath();
        }
        else if (typeof nestedParams !== 'object') {
            throw new InvalidDotNotationPath();
        }
        return this._castParam(keys, nestedParams, expectedType, opts);
    }
    paramsFor(dreamClass, opts) {
        return params_1.default.for(opts?.key ? this.params[opts.key] : this.params, dreamClass, opts);
    }
    getCookie(name) {
        return this.session.getCookie(name);
    }
    setCookie(name, data, opts = {}) {
        return this.session.setCookie(name, data, opts);
    }
    startSession(user) {
        return this.setCookie(this.config.authSessionKey, JSON.stringify({
            id: user.primaryKeyValue,
            modelKey: user.constructor.globalName,
        }));
    }
    endSession() {
        return this.session.clearCookie(this.config.authSessionKey);
    }
    singleObjectJson(data, opts) {
        if (!data)
            return data;
        const dreamApp = dream_1.DreamApplication.getOrFail();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        const lookup = exports.controllerSerializerIndex.lookupModel(this.constructor, data.constructor);
        if (lookup?.length) {
            const serializerClass = lookup?.[1];
            if (typeof serializerClass === 'function' && serializerClass.isDreamSerializer) {
                return new serializerClass(data).passthrough(this.defaultSerializerPassthrough).render();
            }
        }
        else {
            const serializerKey = 
            // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
            data.serializers?.[opts.serializerKey || 'default'];
            if (serializerKey && Object.prototype.hasOwnProperty.call(dreamApp.serializers, serializerKey)) {
                const serializerClass = dreamApp.serializers[serializerKey];
                if (typeof serializerClass === 'function' && serializerClass.isDreamSerializer) {
                    return new serializerClass(data).passthrough(this.defaultSerializerPassthrough).render();
                }
                else {
                    throw new Error(`
A serializer key was detected, but the server was unable to identify an associated serializer class matching the key.
The key in question is: "${serializerKey}"`);
                }
            }
        }
        return data;
    }
    json(data, opts = {}) {
        if (Array.isArray(data))
            return this.res.json(data.map(d => 
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            this.singleObjectJson(d, opts)));
        return this.res.json(this.singleObjectJson(data, opts));
    }
    serializerPassthrough(passthrough) {
        this.defaultSerializerPassthrough = {
            ...this.defaultSerializerPassthrough,
            ...passthrough,
        };
    }
    respond(data = {}, opts = {}) {
        const openapiData = this.constructor.openapi[this.action];
        this.res.status(openapiData?.['status'] || 200);
        this.json(data, opts);
    }
    ok(data = {}, opts = {}) {
        this.json(data, opts);
    }
    created(data = {}, opts = {}) {
        this.res.status(201);
        this.json(data, opts);
    }
    accepted(data = {}, opts = {}) {
        this.res.status(202);
        this.json(data, opts);
    }
    noContent() {
        this.res.sendStatus(204);
    }
    setStatus(status) {
        const resolvedStatus = status.constructor === Number ? status : parseInt(status_codes_1.default[status]);
        this.res.status(resolvedStatus);
    }
    send(message) {
        if (typeof message === 'number') {
            this.res.status(message).send();
        }
        else {
            const statusLookup = status_codes_1.default[message];
            if (typeof statusLookup === 'string') {
                this.res.status(parseInt(statusLookup)).send();
            }
            else {
                this.res.send(message);
            }
        }
    }
    redirect(path) {
        this.res.redirect(path);
    }
    // 400
    badRequest(data = {}) {
        throw new bad_request_1.default('The server cannot or will not process the request due to something that is perceived to be a client error (e.g., malformed request syntax, invalid request message framing, or deceptive request routing).', data);
    }
    // 422
    unprocessableEntity(data = {}) {
        throw new unprocessable_entity_1.default('The data passed contained an invalid shape', data);
    }
    // 401
    unauthorized() {
        throw new unauthorized_1.default('Authorization required');
    }
    // 403
    forbidden() {
        throw new forbidden_1.default('Forbidden');
    }
    // 404
    notFound() {
        throw new not_found_1.default('The resource you requested could not be found');
    }
    // 409
    conflict() {
        throw new conflict_1.default('A conflcit was detected while processing your request');
    }
    // 500
    internalServerError(data = {}) {
        throw new internal_server_error_1.default('The server has encountered a situation it does not know how to handle.', data);
    }
    // 501
    notImplemented(data = {}) {
        throw new internal_server_error_1.default('The request method is not supported by the server and cannot be handled. The only methods that servers are required to support (and therefore that must not return this code) are GET and HEAD', data);
    }
    // 503
    serviceUnavailable() {
        throw new service_unavailable_1.default('The service you requested is currently unavailable');
    }
    async runAction(action) {
        await this.runBeforeActionsFor(action);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
        await this[action]();
    }
    async runBeforeActionsFor(action) {
        const beforeActions = this.constructor.controllerHooks.filter(hook => hook.shouldFireForAction(action));
        for (const hook of beforeActions) {
            if (hook.isStatic) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
                await this.constructor[hook.methodName]();
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
                await this[hook.methodName]();
            }
        }
    }
}
/**
 * @internal
 *
 * Used to store controller hooks, which are registered
 * by using the `@BeforeAction` decorator on your controllers
 */
PsychicController.controllerHooks = [];
exports.default = PsychicController;
class ControllerSerializerIndex {
    constructor() {
        this.associations = [];
    }
    add(ControllerClass, SerializerClass, ModelClass) {
        this.associations.push([ControllerClass, SerializerClass, ModelClass]);
    }
    lookupModel(ControllerClass, ModelClass) {
        return this.associations.find(association => association[0] === ControllerClass && association[2] === ModelClass);
    }
    lookupSerializer(ControllerClass, SerializerClass) {
        return this.associations.find(association => association[0] === ControllerClass && association[1] === SerializerClass);
    }
}
exports.ControllerSerializerIndex = ControllerSerializerIndex;
exports.controllerSerializerIndex = new ControllerSerializerIndex();
