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
exports.default = newPsychicApp;
const c = __importStar(require("colorette"));
const fs = __importStar(require("fs"));
const AppConfigBuilder_1 = __importDefault(require("../file-builders/AppConfigBuilder"));
const DreamConfigBuilder_1 = __importDefault(require("../file-builders/DreamConfigBuilder"));
const EnvBuilder_1 = __importDefault(require("../file-builders/EnvBuilder"));
const EslintConfBuilder_1 = __importDefault(require("../file-builders/EslintConfBuilder"));
const PackagejsonBuilder_1 = __importDefault(require("../file-builders/PackagejsonBuilder"));
const ViteConfBuilder_1 = __importDefault(require("../file-builders/ViteConfBuilder"));
const copyRecursive_1 = __importDefault(require("./copyRecursive"));
const gatherUserInput_1 = __importDefault(require("./gatherUserInput"));
const log_1 = __importDefault(require("./log"));
const logo_1 = __importDefault(require("./logo"));
const sleep_1 = __importDefault(require("./sleep"));
const sspawn_1 = __importDefault(require("./sspawn"));
const welcomeMessage_1 = __importDefault(require("./welcomeMessage"));
function testEnv() {
    return process.env.NODE_ENV === 'test';
}
async function newPsychicApp(appName, args) {
    const userOptions = await (0, gatherUserInput_1.default)(args);
    if (!testEnv()) {
        log_1.default.clear();
        log_1.default.write((0, logo_1.default)() + '\n\n', { cache: true });
        log_1.default.write(c.green(`Installing psychic framework to ./${appName}`), { cache: true });
        log_1.default.write(c.green(`Step 1. writing boilerplate to ${appName}...`));
    }
    let projectPath;
    const rootPath = `./${appName}`;
    if (userOptions.apiOnly) {
        projectPath = `./${appName}`;
        (0, copyRecursive_1.default)(__dirname + '/../../boilerplate/api', `./${appName}`);
    }
    else {
        projectPath = `./${appName}/api`;
        fs.mkdirSync(`./${appName}`);
        (0, copyRecursive_1.default)(__dirname + '/../../boilerplate/api', projectPath);
    }
    fs.renameSync(`${projectPath}/yarnrc.yml`, `${projectPath}/.yarnrc.yml`);
    fs.renameSync(`${projectPath}/gitignore`, `${projectPath}/.gitignore`);
    if (!testEnv()) {
        log_1.default.restoreCache();
        log_1.default.write(c.green(`Step 1. write boilerplate to ${appName}: Done!`), { cache: true });
        log_1.default.write(c.green(`Step 2. building default config files...`));
    }
    fs.writeFileSync(`${projectPath}/.env`, EnvBuilder_1.default.build({ appName, env: 'development' }));
    fs.writeFileSync(`${projectPath}/.env.test`, EnvBuilder_1.default.build({ appName, env: 'test' }));
    fs.writeFileSync(projectPath + '/package.json', await PackagejsonBuilder_1.default.buildAPI(userOptions));
    fs.writeFileSync(`${projectPath}/src/conf/app.ts`, await AppConfigBuilder_1.default.build({ appName, userOptions }));
    fs.writeFileSync(`${projectPath}/src/conf/dream.ts`, await DreamConfigBuilder_1.default.build({ appName, userOptions }));
    if (!testEnv()) {
        log_1.default.restoreCache();
        log_1.default.write(c.green(`Step 2. build default config files: Done!`), { cache: true });
        log_1.default.write(c.green(`Step 3. Installing psychic dependencies...`));
        // only run yarn install if not in test env to save time
        await (0, sspawn_1.default)(`cd ${projectPath} && mkdir node_modules && touch yarn.lock && corepack enable && yarn set version berry && yarn install`);
    }
    // sleeping here because yarn has a delayed print that we need to clean up
    if (!testEnv())
        await (0, sleep_1.default)(1000);
    if (!testEnv()) {
        log_1.default.restoreCache();
        log_1.default.write(c.green(`Step 3. Install psychic dependencies: Done!`), { cache: true });
        log_1.default.write(c.green(`Step 4. Initializing git repository...`));
        // only do this if not test, since using git in CI will fail
        await (0, sspawn_1.default)(`cd ./${appName} && git init`);
    }
    if (!testEnv()) {
        log_1.default.restoreCache();
        log_1.default.write(c.green(`Step 4. Initialize git repository: Done!`), { cache: true });
        log_1.default.write(c.green(`Step 5. Building project...`));
    }
    // don't sync yet, since we need to run migrations first
    // await sspawn(`yarn --cwd=${projectPath} dream sync:existing`)
    const errors = [];
    if (!testEnv() || process.env.REALLY_BUILD_CLIENT_DURING_SPECS === '1')
        if (!userOptions.apiOnly) {
            switch (userOptions.client) {
                case 'react':
                    await (0, sspawn_1.default)(`cd ${rootPath} && yarn create vite client --template react-ts && cd client`);
                    fs.mkdirSync(`./${appName}/client/src/config`);
                    (0, copyRecursive_1.default)(__dirname + '/../../boilerplate/client/api', `${projectPath}/../client/src/api`);
                    (0, copyRecursive_1.default)(__dirname + '/../../boilerplate/client/config/routes.ts', `${projectPath}/../client/src/config/routes.ts`);
                    (0, copyRecursive_1.default)(__dirname + '/../../boilerplate/client/node-version', `${projectPath}/../client/.node-version`);
                    fs.writeFileSync(projectPath + '/../client/vite.config.ts', ViteConfBuilder_1.default.build(userOptions));
                    fs.writeFileSync(projectPath + '/../client/.eslintrc.cjs', EslintConfBuilder_1.default.buildForViteReact());
                    break;
                case 'vue':
                    await (0, sspawn_1.default)(`cd ${rootPath} && yarn create vite client --template vue-ts`);
                    fs.mkdirSync(`./${appName}/client/src/config`);
                    (0, copyRecursive_1.default)(__dirname + '/../../boilerplate/client/api', `${projectPath}/../client/src/api`);
                    (0, copyRecursive_1.default)(__dirname + '/../../boilerplate/client/config/routes.ts', `${projectPath}/../client/src/config/routes.ts`);
                    (0, copyRecursive_1.default)(__dirname + '/../../boilerplate/client/node-version', `${projectPath}/../client/.node-version`);
                    fs.writeFileSync(projectPath + '/../client/vite.config.ts', ViteConfBuilder_1.default.build(userOptions));
                    break;
                case 'nuxt':
                    await (0, sspawn_1.default)(`cd ${rootPath} && yarn create nuxt-app client`);
                    fs.mkdirSync(`./${appName}/client/config`);
                    (0, copyRecursive_1.default)(__dirname + '/../../boilerplate/client/api', `${projectPath}/../client/src/api`);
                    (0, copyRecursive_1.default)(__dirname + '/../../boilerplate/client/config/routes.ts', `${projectPath}/../client/config/routes.ts`);
                    (0, copyRecursive_1.default)(__dirname + '/../../boilerplate/client/node-version', `${projectPath}/../client/.node-version`);
                    break;
            }
            if (!testEnv()) {
                // only bother installing packages if not in test env to save time
                await (0, sspawn_1.default)(`cd ${projectPath}/../client && mkdir node_modules && touch yarn.lock && corepack enable && yarn set version berry && yarn install`);
                try {
                    await (0, sspawn_1.default)(`cd ${projectPath}/../client && yarn add axios`);
                }
                catch (err) {
                    errors.push(`
          ATTENTION:
            we attempted to install axios for you in your client folder,
            but it failed. The error we received was:

        `);
                    console.error(err);
                }
            }
        }
    if (!testEnv()) {
        // do not use git during tests, since this will break in CI
        await (0, sspawn_1.default)(`cd ./${appName} && git add --all && git commit -m 'psychic init' --quiet`);
        log_1.default.restoreCache();
        log_1.default.write(c.green(`Step 5. Build project: Done!`), { cache: true });
        console.log((0, welcomeMessage_1.default)(appName));
        errors.forEach(err => {
            console.log(err);
        });
    }
}
