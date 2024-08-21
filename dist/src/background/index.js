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
exports.stopBackgroundWorkers = exports.Background = void 0;
const dream_1 = require("@rvohealth/dream");
const bullmq_1 = require("bullmq");
const developmentOrTestEnv_1 = __importDefault(require("../../boot/cli/helpers/developmentOrTestEnv"));
const absoluteFilePath_1 = __importDefault(require("../helpers/absoluteFilePath"));
const envValue_1 = __importStar(require("../helpers/envValue"));
const importFileWithDefault_1 = __importDefault(require("../helpers/importFileWithDefault"));
const importFileWithNamedExport_1 = __importDefault(require("../helpers/importFileWithNamedExport"));
const psychic_application_1 = __importDefault(require("../psychic-application"));
const lookupClassByGlobalName_1 = __importDefault(require("../psychic-application/helpers/lookupClassByGlobalName"));
const redisOptions_1 = __importDefault(require("../psychic-application/helpers/redisOptions"));
class Background {
    constructor() {
        this.queue = null;
        this.workers = [];
    }
    connect() {
        if ((0, dream_1.testEnv)() && !(0, envValue_1.devEnvBool)('REALLY_TEST_BACKGROUND_QUEUE'))
            return;
        if (this.queue)
            return;
        const psychicApp = psychic_application_1.default.getOrFail();
        if (!psychicApp?.useRedis)
            throw new Error(`attempting to use background jobs, but config.useRedis is not set to true.`);
        const connectionOptions = (0, redisOptions_1.default)('background_jobs');
        const bullConnectionOpts = {
            host: connectionOptions.host,
            username: connectionOptions.username,
            password: connectionOptions.password,
            port: connectionOptions.port ? parseInt(connectionOptions.port) : undefined,
            tls: connectionOptions.secure
                ? {
                    rejectUnauthorized: false,
                }
                : undefined,
            connectTimeout: 5000,
        };
        const queueOptions = psychicApp.backgroundQueueOptions;
        this.queue ||= new bullmq_1.Queue(`${(0, dream_1.pascalize)(psychicApp.appName)}BackgroundJobQueue`, {
            ...queueOptions,
            connection: bullConnectionOpts,
        });
        this.queueEvents = new bullmq_1.QueueEvents(this.queue.name, { connection: bullConnectionOpts });
        const workerOptions = psychicApp.backgroundWorkerOptions;
        for (let i = 0; i < workerCount(); i++) {
            this.workers.push(new bullmq_1.Worker(`${(0, dream_1.pascalize)(psychicApp.appName)}BackgroundJobQueue`, data => this.handler(data), {
                ...workerOptions,
                connection: bullConnectionOpts,
            }));
        }
    }
    async staticMethod(ObjectClass, method, { delaySeconds, globalName, args = [], priority = 'default', }) {
        this.connect();
        await this._addToQueue(`BackgroundJobQueueStaticJob`, {
            globalName,
            method,
            args,
            priority,
        }, { delaySeconds });
    }
    async scheduledMethod(ObjectClass, pattern, method, { globalName, args = [], priority = 'default', }) {
        this.connect();
        // `jobId` is used to determine uniqueness along with name and repeat pattern.
        // Since the name is really a job type and never changes, the `jobId` is the only
        // way to allow multiple jobs with the same cron repeat pattern. Uniqueness will
        // now be enforced by combining class name, method name, and cron repeat pattern.
        //
        // See: https://docs.bullmq.io/guide/jobs/repeatable
        const jobId = `${ObjectClass.name}:${method}`;
        await this.queue.add('BackgroundJobQueueStaticJob', {
            globalName,
            method,
            args,
            priority,
        }, {
            repeat: {
                pattern,
            },
            jobId,
            priority: this.getPriorityForQueue(priority),
        });
    }
    async instanceMethod(ObjectClass, method, { delaySeconds, globalName, args = [], constructorArgs = [], priority = 'default', }) {
        this.connect();
        await this._addToQueue('BackgroundJobQueueInstanceJob', {
            globalName,
            method,
            args,
            constructorArgs,
            priority,
        }, { delaySeconds });
    }
    async modelInstanceMethod(modelInstance, method, { delaySeconds, args = [], priority = 'default', }) {
        this.connect();
        await this._addToQueue('BackgroundJobQueueModelInstanceJob', {
            id: modelInstance.primaryKeyValue,
            globalName: modelInstance.constructor.globalName,
            method,
            args,
            priority,
        }, { delaySeconds });
    }
    // should be private, but public so we can test
    async _addToQueue(jobType, jobData, { delaySeconds, }) {
        if ((0, dream_1.testEnv)() && !(0, envValue_1.devEnvBool)('REALLY_TEST_BACKGROUND_QUEUE')) {
            await this.doWork(jobType, jobData);
        }
        else {
            await this.queue.add(jobType, jobData, {
                delay: delaySeconds ? delaySeconds * 1000 : undefined,
                priority: this.getPriorityForQueue(jobData.priority),
            });
        }
    }
    getPriorityForQueue(priority) {
        switch (priority) {
            case 'urgent':
                return 1;
            case 'default':
                return 2;
            case 'not_urgent':
                return 3;
            case 'last':
                return 4;
            default:
                return 2;
        }
    }
    async doWork(jobType, { id, method, args, constructorArgs, filepath, importKey, globalName }) {
        // TODO: chat with daniel about background job scenario
        const absFilePath = (0, absoluteFilePath_1.default)(filepath || '');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let objectClass;
        let dreamClass;
        switch (jobType) {
            case 'BackgroundJobQueueFunctionJob':
                if (filepath) {
                    const func = await (0, importFileWithNamedExport_1.default)(absFilePath, importKey);
                    if (!func)
                        return;
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                    await func(...args);
                }
                else if (globalName) {
                    // TODO: determine how to handle global lookup for func background jobs
                    // const classDef = lookupGlobalName(globalName)
                }
                break;
            case 'BackgroundJobQueueStaticJob':
                if (filepath) {
                    objectClass = await (0, importFileWithNamedExport_1.default)(absFilePath, importKey || 'default');
                }
                else if (globalName) {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    objectClass = (0, lookupClassByGlobalName_1.default)(globalName);
                }
                if (!objectClass)
                    return;
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                await objectClass[method](...args);
                break;
            case 'BackgroundJobQueueInstanceJob':
                if (filepath) {
                    objectClass = await (0, importFileWithNamedExport_1.default)(absFilePath, importKey || 'default');
                }
                else if (globalName) {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    objectClass = (0, lookupClassByGlobalName_1.default)(globalName);
                }
                if (objectClass) {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
                    const instance = new objectClass(...constructorArgs);
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                    await instance[method](...args);
                }
                break;
            case 'BackgroundJobQueueModelInstanceJob':
                if (filepath) {
                    dreamClass = await (0, importFileWithDefault_1.default)(absFilePath);
                }
                else if (globalName) {
                    dreamClass = (0, lookupClassByGlobalName_1.default)(globalName);
                }
                if (dreamClass) {
                    const modelInstance = await dreamClass.find(id);
                    if (!modelInstance)
                        return;
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                    await modelInstance[method](...args);
                }
                break;
        }
    }
    async handler(job) {
        const jobType = job.name;
        await this.doWork(jobType, 
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        job.data);
    }
}
exports.Background = Background;
function workerCount() {
    if ((0, envValue_1.default)('WORKER_COUNT'))
        return parseInt((0, envValue_1.default)('WORKER_COUNT'));
    return (0, developmentOrTestEnv_1.default)() ? 1 : 0;
}
const background = new Background();
exports.default = background;
async function stopBackgroundWorkers() {
    await Promise.all(background.workers.map(worker => worker.close()));
}
exports.stopBackgroundWorkers = stopBackgroundWorkers;
