"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyResourceAction = exports.applyResourcesAction = exports.namespacedControllerActionString = exports.namespacedRoute = exports.controllerGlobalNameFromControllerPath = exports.sanitizedControllerPath = exports.resourcePath = exports.routePath = void 0;
const dream_1 = require("@rvohealth/dream");
function routePath(routePath) {
    return `/${routePath.replace(/^\//, '')}`;
}
exports.routePath = routePath;
function resourcePath(routePath) {
    return `/${routePath}/:id`;
}
exports.resourcePath = resourcePath;
function sanitizedControllerPath(controllerName) {
    return controllerName.replace(/Controller$/, '') + 'Controller';
}
exports.sanitizedControllerPath = sanitizedControllerPath;
function controllerGlobalNameFromControllerPath(controllerName) {
    return `controllers/${sanitizedControllerPath(controllerName)}`;
}
exports.controllerGlobalNameFromControllerPath = controllerGlobalNameFromControllerPath;
function namespacedRoute(namespace, route) {
    const compactedRoutes = (0, dream_1.compact)([namespace || null, route]);
    return '/' + compactedRoutes.join('/').replace(/^\//, '');
}
exports.namespacedRoute = namespacedRoute;
function namespacedControllerActionString(namespace, controllerActionString) {
    return [
        namespace
            .split('/')
            .filter(part => !/^:/.test(part))
            .map(part => (0, dream_1.pascalize)(part))
            .join('/'),
        controllerActionString,
    ]
        .join('/')
        .replace(/^\//, '');
}
exports.namespacedControllerActionString = namespacedControllerActionString;
function applyResourcesAction(path, action, routingMechanism, options) {
    const controllerName = options?.controller || (0, dream_1.pascalize)(path);
    switch (action) {
        case 'index':
            routingMechanism.get(path, `${controllerName}#index`);
            break;
        case 'create':
            routingMechanism.post(path, `${controllerName}#create`);
            break;
        case 'update':
            routingMechanism.put(`${path}/:id`, `${controllerName}#update`);
            routingMechanism.patch(`${path}/:id`, `${controllerName}#update`);
            break;
        case 'show':
            routingMechanism.get(`${path}/:id`, `${controllerName}#show`);
            break;
        case 'destroy':
            routingMechanism.delete(`${path}/:id`, `${controllerName}#destroy`);
            break;
    }
}
exports.applyResourcesAction = applyResourcesAction;
function applyResourceAction(path, action, routingMechanism, options) {
    const controllerName = options?.controller || (0, dream_1.pascalize)(path);
    switch (action) {
        case 'create':
            routingMechanism.post(path, `${controllerName}#create`);
            break;
        case 'update':
            routingMechanism.put(path, `${controllerName}#update`);
            routingMechanism.patch(path, `${controllerName}#update`);
            break;
        case 'show':
            routingMechanism.get(path, `${controllerName}#show`);
            break;
        case 'destroy':
            routingMechanism.delete(path, `${controllerName}#destroy`);
            break;
        default:
            throw `unsupported resource method type: ${action}`;
    }
}
exports.applyResourceAction = applyResourceAction;
