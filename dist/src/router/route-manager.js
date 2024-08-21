"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class RouteManager {
    constructor() {
        this.routes = [];
    }
    addRoute({ httpMethod, path, controllerActionString, }) {
        this.routes.push({
            httpMethod,
            path,
            controllerActionString,
        });
    }
}
exports.default = RouteManager;
