"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function openapiRoute(route) {
    const sanitizedRoute = route.replace(/^\//, '').replace(/:([^/]*)(\/|$)/g, '{$1}');
    return `/${sanitizedRoute}`;
}
exports.default = openapiRoute;
