"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PsychicNestedRouter = void 0;
const pluralize = require("pluralize");
const dream_1 = require("@rvohealth/dream");
const express_1 = require("express");
const envValue_1 = require("../helpers/envValue");
const log_1 = __importDefault(require("../log"));
const helpers_1 = require("../router/helpers");
const route_manager_1 = __importDefault(require("./route-manager"));
const types_1 = require("./types");
class PsychicRouter {
    constructor(app, config) {
        this.currentNamespaces = [];
        this.routeManager = new route_manager_1.default();
        this.app = app;
        this.config = config;
    }
    get routingMechanism() {
        return this.app;
    }
    get routes() {
        return this.routeManager.routes;
    }
    get currentNamespacePaths() {
        return this.currentNamespaces.map(n => n.namespace);
    }
    // this is called after all routes have been processed.
    commit() {
        this.routes.forEach(route => {
            this.app[route.httpMethod]((0, helpers_1.routePath)(route.path), (req, res) => {
                this.handle(route.controllerActionString, { req, res }).catch(() => { });
            });
        });
    }
    get(path, controllerActionString) {
        this.crud('get', path, controllerActionString);
    }
    post(path, controllerActionString) {
        this.crud('post', path, controllerActionString);
    }
    put(path, controllerActionString) {
        this.crud('put', path, controllerActionString);
    }
    patch(path, controllerActionString) {
        this.crud('patch', path, controllerActionString);
    }
    delete(path, controllerActionString) {
        this.crud('delete', path, controllerActionString);
    }
    options(path, controllerActionString) {
        this.crud('options', path, controllerActionString);
    }
    prefixControllerActionStringWithNamespaces(controllerActionString) {
        const [controllerName] = controllerActionString.split('#');
        const filteredNamespaces = this.currentNamespaces.filter(n => !n.isScope && !(n.resourceful && (0, dream_1.pascalize)(n.namespace) === controllerName));
        if (!filteredNamespaces.length)
            return controllerActionString;
        return filteredNamespaces.map(str => (0, dream_1.pascalize)(str.namespace)).join('/') + '/' + controllerActionString;
    }
    prefixPathWithNamespaces(str) {
        if (!this.currentNamespaces.length)
            return str;
        return '/' + this.currentNamespacePaths.join('/') + '/' + str;
    }
    crud(httpMethod, path, controllerActionString) {
        this.routeManager.addRoute({
            httpMethod,
            path: this.prefixPathWithNamespaces(path),
            controllerActionString: this.prefixControllerActionStringWithNamespaces(controllerActionString),
        });
    }
    namespace(namespace, cb) {
        const nestedRouter = new PsychicNestedRouter(this.app, this.config, this.routeManager, {
            namespaces: this.currentNamespaces,
        });
        this.runNestedCallbacks(namespace, nestedRouter, cb);
    }
    scope(scope, cb) {
        const nestedRouter = new PsychicNestedRouter(this.app, this.config, this.routeManager, {
            namespaces: this.currentNamespaces,
        });
        this.runNestedCallbacks(scope, nestedRouter, cb, { treatNamespaceAsScope: true });
    }
    resources(path, optionsOrCb, cb) {
        return this.makeResource(path, optionsOrCb, cb, true);
    }
    resource(path, optionsOrCb, cb) {
        return this.makeResource(path, optionsOrCb, cb, false);
    }
    collection(cb) {
        const replacedNamespaces = this.currentNamespaces.slice(0, this.currentNamespaces.length - 1);
        const nestedRouter = new PsychicNestedRouter(this.app, this.config, this.routeManager, {
            namespaces: replacedNamespaces,
        });
        const currentNamespace = replacedNamespaces[replacedNamespaces.length - 1];
        if (!currentNamespace)
            throw 'Must be within a resource to call the collection method';
        cb(nestedRouter);
    }
    makeResource(path, optionsOrCb, cb, plural) {
        if (cb) {
            if (typeof optionsOrCb === 'function')
                throw 'cannot pass a function as a second arg when passing 3 args';
            this._makeResource(path, optionsOrCb, cb, plural);
        }
        else {
            if (typeof optionsOrCb === 'function')
                this._makeResource(path, undefined, optionsOrCb, plural);
            else
                this._makeResource(path, optionsOrCb, undefined, plural);
        }
    }
    _makeResource(path, options, cb, plural) {
        const nestedRouter = new PsychicNestedRouter(this.app, this.config, this.routeManager, {
            namespaces: this.currentNamespaces,
        });
        const { only, except } = options || {};
        let resourceMethods = plural ? types_1.ResourcesMethods : types_1.ResourceMethods;
        if (only) {
            resourceMethods = only;
        }
        else if (except) {
            resourceMethods = resourceMethods.filter(m => !except.includes(m));
        }
        this.makeRoomForNewIdParam(nestedRouter);
        this.runNestedCallbacks(path, nestedRouter, cb, { asMember: plural, resourceful: true });
        resourceMethods.forEach(action => {
            if (plural) {
                (0, helpers_1.applyResourcesAction)(path, action, nestedRouter, options);
            }
            else {
                (0, helpers_1.applyResourceAction)(path, action, nestedRouter, options);
            }
        });
    }
    runNestedCallbacks(namespace, nestedRouter, cb, { asMember = false, resourceful = false, treatNamespaceAsScope = false, } = {}) {
        this.addNamespace(namespace, resourceful, { nestedRouter, treatNamespaceAsScope });
        if (asMember) {
            this.addNamespace(':id', resourceful, { nestedRouter, treatNamespaceAsScope: true });
        }
        if (cb)
            cb(nestedRouter);
        this.removeLastNamespace(nestedRouter);
        if (asMember)
            this.removeLastNamespace(nestedRouter);
    }
    addNamespace(namespace, resourceful, { nestedRouter, treatNamespaceAsScope, } = {}) {
        this.currentNamespaces = [
            ...this.currentNamespaces,
            {
                namespace,
                resourceful,
                isScope: treatNamespaceAsScope || false,
            },
        ];
        if (nestedRouter)
            nestedRouter.currentNamespaces = this.currentNamespaces;
    }
    removeLastNamespace(nestedRouter) {
        this.currentNamespaces.pop();
        if (nestedRouter)
            nestedRouter.currentNamespaces = this.currentNamespaces;
    }
    makeRoomForNewIdParam(nestedRouter) {
        this.currentNamespaces = [
            ...this.currentNamespaces.map((namespace, index) => {
                const previousNamespace = this.currentNamespaces[index - 1];
                if (namespace.namespace === ':id' && previousNamespace) {
                    return {
                        ...namespace,
                        namespace: `:${(0, dream_1.camelize)(pluralize.singular(previousNamespace.namespace))}Id`,
                    };
                }
                else
                    return namespace;
            }),
        ];
        if (nestedRouter)
            nestedRouter.currentNamespaces = this.currentNamespaces;
    }
    async handle(controllerActionString, { req, res, }) {
        const [controllerPath, action] = controllerActionString.split('#');
        const ControllerClass = this.config.controllers[(0, helpers_1.controllerGlobalNameFromControllerPath)(controllerPath)];
        if (!ControllerClass) {
            res.status(501).send(`
        The controller you are attempting to load was not found:
          ${controllerPath}
      `);
            return;
        }
        const controller = this._initializeController(ControllerClass, req, res, action);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        const controllerAction = controller[action];
        if (!controllerAction) {
            res.status(501).send(`
        The method ${action} is not defined controller:
          ${controllerPath}
      `);
            return;
        }
        try {
            await controller.runAction(action);
        }
        catch (error) {
            const err = error;
            if (!(0, dream_1.testEnv)())
                log_1.default.error(err.message);
            let validationError;
            let paramValidationError;
            let validationErrors;
            let errorsJson = {};
            switch (err.constructor?.name) {
                case 'Unauthorized':
                case 'Forbidden':
                case 'NotFound':
                case 'Conflict':
                case 'BadRequest':
                case 'NotImplemented':
                case 'ServiceUnavailable':
                    res.sendStatus(err.status);
                    break;
                case 'RecordNotFound':
                    res.sendStatus(404);
                    break;
                case 'ValidationError':
                    validationError = err;
                    validationErrors = validationError.errors || {};
                    res.status(422).json({
                        errors: validationErrors,
                    });
                    break;
                case 'ParamValidationError':
                    paramValidationError = error;
                    try {
                        errorsJson = JSON.parse(paramValidationError.message);
                    }
                    catch (err) {
                        // noop
                    }
                    res.status(400).json({
                        errors: errorsJson,
                    });
                    break;
                case 'UnprocessableEntity':
                    res.status(422).json(err.data);
                    break;
                case 'InternalServerError':
                default:
                    // by default, ts-node will mask these errors for no good reason, causing us
                    // to have to apply an ugly and annoying try-catch pattern to our controllers
                    // and manually console log the error to determine what the actual error was.
                    // this block enables us to not have to do that anymore.
                    if ((0, dream_1.testEnv)() && !(0, envValue_1.devEnvBool)('PSYCHIC_EXPECTING_INTERNAL_SERVER_ERROR')) {
                        console.log('ATTENTION: a server error was detected:');
                        console.error(err);
                    }
                    if (this.config.specialHooks.serverError.length) {
                        try {
                            for (const hook of this.config.specialHooks.serverError) {
                                await hook(err, req, res);
                            }
                        }
                        catch (error) {
                            if ((0, dream_1.developmentOrTestEnv)()) {
                                // In development and test, we want to throw so that, for example, double-setting of
                                // status headers throws an error in specs. We couldn't figure out how to write
                                // a spec for ensuring that such errors made it through because Supertest would
                                // respond with the first header sent, which was successful, and the exception only
                                // happened when Jest ended the spec.
                                throw error;
                            }
                            else {
                                console.error(`
                  Something went wrong while attempting to call your custom server:error hooks.
                  Psychic will rescue errors thrown here to prevent the server from crashing.
                  The error thrown is:
                `);
                                console.error(error);
                            }
                        }
                    }
                    else
                        throw err;
            }
        }
    }
    _initializeController(ControllerClass, req, res, action) {
        return new ControllerClass(req, res, {
            config: this.config,
            action,
        });
    }
}
exports.default = PsychicRouter;
class PsychicNestedRouter extends PsychicRouter {
    constructor(app, config, routeManager, { namespaces = [], } = {}) {
        super(app, config);
        this.router = (0, express_1.Router)();
        this.currentNamespaces = namespaces;
        this.routeManager = routeManager;
    }
    get routingMechanism() {
        return this.router;
    }
}
exports.PsychicNestedRouter = PsychicNestedRouter;
