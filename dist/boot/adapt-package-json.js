"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./cli/helpers/loadAppEnvFromBoot");
const promises_1 = __importDefault(require("fs/promises"));
const package_json_1 = __importDefault(require("../package.json"));
const path_1 = __importDefault(require("path"));
async function adaptPackageJson() {
    if (process.env.NODE_ENV === 'production') {
        package_json_1.default.main = 'dist/src/index.js';
    }
    else {
        package_json_1.default.main = 'src/index.ts';
    }
    await promises_1.default.writeFile(path_1.default.join(__dirname, '..', 'package.json'), JSON.stringify(package_json_1.default, null, 2));
}
exports.default = adaptPackageJson;
void adaptPackageJson();
