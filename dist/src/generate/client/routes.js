"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dream_1 = require("@rvohealth/dream");
function generateClientRoutes(routes) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const routesObj = {};
    routes.forEach(route => {
        const segments = route.path.replace(/^\//, '').split('/');
        const paramSegments = segments
            .filter(segment => /^:/.test(segment))
            .map(segment => segment.replace(/^:/, ''));
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        recursivelyBuildRoutesObj({ routesObj, segments, paramSegments, route });
    });
    const str = recursivelyBuildRoutesStr(routesObj, '', 1);
    return `\
const apiRoutes = {${str}
} as const
export default apiRoutes

export type UriParam = string | number`;
}
exports.default = generateClientRoutes;
function recursivelyBuildRoutesObj({ routesObj, segments, paramSegments, route, }) {
    segments.reduce((currObj, routeSegment, index) => {
        const sanitizedSegment = routeSegment.replace(/^:/, '');
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        currObj[sanitizedSegment] ||= {};
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        currObj = currObj[sanitizedSegment];
        if (index === segments.length - 1) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            currObj[route.httpMethod.toUpperCase()] = route.path.includes(':')
                ? clientPathFunc(paramSegments, segments)
                : clientPathStr(route.path);
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return currObj;
    }, routesObj);
}
function spaces(numIterations) {
    let spaces = '';
    for (let i = 0; i < numIterations; i++) {
        spaces += '  ';
    }
    return spaces;
}
function safeObjectKey(key) {
    if (/^[A-Za-z0-9]*$/.test(key))
        return key;
    return `'${key}'`;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function recursivelyBuildRoutesStr(routesObj, str, numIterations) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return Object.keys(routesObj).reduce((agg, key) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (typeof routesObj[key] === 'string') {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
            const pathStr = /^\(/.test(routesObj[key]) ? routesObj[key] : `'${routesObj[key]}'`;
            agg += `\n${spaces(numIterations)}${safeObjectKey(key)}: ${pathStr},`;
        }
        else {
            agg += `
${spaces(numIterations)}${safeObjectKey((0, dream_1.camelize)(key)) || "'/'"}: {`;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            agg = recursivelyBuildRoutesStr(routesObj[key], agg, numIterations + 1);
            agg += `\n${spaces(numIterations)}},`;
        }
        return agg;
    }, str);
}
function clientPathFunc(paramSegments, segments) {
    return `\
({ ${paramSegments.map(segment => segment.replace(/^:/, '')).join(', ')} }: { ${paramSegments
        .map(segment => segment.replace(/^:/, '') + ': UriParam')
        .join(', ')} }) => \`/${segments
        .map(segment => (/^:/.test(segment) ? `$\{${segment.replace(/^:/, '')}}` : segment))
        .join('/')
        .replace(/^\//, '')}\``;
}
function clientPathStr(path) {
    return `/${path.replace(/^\//, '')}`;
}
