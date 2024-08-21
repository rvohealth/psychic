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
const colors = __importStar(require("colorette"));
const server_1 = __importDefault(require("../../server"));
async function printRoutes() {
    const server = new server_1.default();
    await server.boot();
    const routes = await server.routes();
    const expressions = buildExpressions(routes);
    // NOTE: intentionally doing this outside of the expression loop below
    // to avoid N+1
    const desiredFirstGapSpaceCount = calculateNumSpacesInFirstGap(expressions);
    const desiredLastGapSpaceCount = calculateNumSpacesInLastGap(expressions);
    expressions.forEach(([beginning, end], i) => {
        const partialExpression = `${beginning}${makeSpaces(beginning, desiredFirstGapSpaceCount)}${end}`;
        const closingSpaces = makeSpaces(partialExpression, desiredLastGapSpaceCount);
        const expression = `${partialExpression}${closingSpaces}`;
        const colorizedExpression = i % 2 ? colors.bgWhite(colors.black(expression)) : expression;
        console.log(colorizedExpression);
    });
}
exports.default = printRoutes;
function buildExpressions(routes) {
    return routes.map(route => {
        const method = route.httpMethod.toUpperCase();
        const numMethodSpaces = 8 - method.length;
        const beginningOfExpression = `${route.httpMethod.toUpperCase()}${' '.repeat(numMethodSpaces)}${route.path}`;
        const endOfExpression = route.controllerActionString;
        return [beginningOfExpression, endOfExpression];
    });
}
function makeSpaces(expression, desiredCount) {
    return ' '.repeat(Math.max(desiredCount - expression.length, 1));
}
function calculateNumSpacesInFirstGap(expressions) {
    let desiredSpaceCount = 0;
    expressions.forEach(expression => {
        if (expression[0].length > desiredSpaceCount)
            desiredSpaceCount = expression[0].length;
    });
    const gapSpaces = 3;
    return desiredSpaceCount + gapSpaces;
}
function calculateNumSpacesInLastGap(expressions) {
    const desiredFirstGapSpaceCount = calculateNumSpacesInFirstGap(expressions);
    let desiredSpaceCount = 0;
    expressions.forEach(([beginning, end]) => {
        const spaces = desiredFirstGapSpaceCount - beginning.length;
        const expression = `${beginning}${spaces}${end}`;
        if (expression.length > desiredSpaceCount)
            desiredSpaceCount = expression.length;
    });
    return desiredSpaceCount + 3;
}
