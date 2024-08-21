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
exports.getControllersOrBlank = exports.getControllersOrFail = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const globalControllerKeyFromPath_1 = __importDefault(require("./globalControllerKeyFromPath"));
let _controllers;
async function loadControllers(controllersPath) {
    if (_controllers)
        return _controllers;
    _controllers = {};
    const controllerPaths = (await getFiles(controllersPath)).filter(path => /\.[jt]s$/.test(path));
    for (const controllerPath of controllerPaths) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        const potentialControllerClass = (await Promise.resolve(`${controllerPath}`).then(s => __importStar(require(s)))).default;
        if (potentialControllerClass?.isPsychicController) {
            const controllerClass = potentialControllerClass;
            const controllerKey = (0, globalControllerKeyFromPath_1.default)(controllerPath, controllersPath);
            controllerClass['setGlobalName'](controllerKey);
            _controllers[controllerKey] = controllerClass;
        }
    }
    return _controllers;
}
exports.default = loadControllers;
function getControllersOrFail() {
    if (!_controllers)
        throw new Error('Must call loadModels before calling getModelsOrFail');
    return _controllers;
}
exports.getControllersOrFail = getControllersOrFail;
function getControllersOrBlank() {
    return _controllers || {};
}
exports.getControllersOrBlank = getControllersOrBlank;
async function getFiles(dir) {
    const dirents = await promises_1.default.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(dirents.map(dirent => {
        const res = path_1.default.resolve(dir, dirent.name);
        return dirent.isDirectory() ? getFiles(res) : res;
    }));
    return Array.prototype.concat(...files);
}
