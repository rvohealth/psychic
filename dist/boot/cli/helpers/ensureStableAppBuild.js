"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeTestInfrastructureFor = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const developmentOrTestEnv_1 = __importDefault(require("./developmentOrTestEnv"));
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function ensureStableAppBuild(programArgs) {
    if (!(0, developmentOrTestEnv_1.default)())
        return;
    console.log('checking app for build stability...');
    await removeTestInfrastructureFor('dream');
    await removeTestInfrastructureFor('psychic');
}
exports.default = ensureStableAppBuild;
async function removeTestInfrastructureFor(pkg) {
    try {
        await promises_1.default.stat(`./node_modules/${pkg}/test-app`);
        console.log(`test-app still present in ${pkg} installation, removing...`);
        await promises_1.default.rm(`./node_modules/${pkg}/test-app`, { recursive: true, force: true });
    }
    catch (error) {
        // intentionally ignore, since we expect this dir to be empty.
    }
}
exports.removeTestInfrastructureFor = removeTestInfrastructureFor;
