"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientTypes = exports.primaryKeyTypes = void 0;
const argAndValue_1 = __importDefault(require("./argAndValue"));
const select_1 = __importDefault(require("./select"));
exports.primaryKeyTypes = ['bigserial', 'bigint', 'integer', 'uuid'];
exports.clientTypes = ['react', 'vue', 'nuxt', 'none (api only)', 'none'];
async function redisQuestion(args, options) {
    const [redisArg, value] = (0, argAndValue_1.default)('--redis', args);
    if (redisArg) {
        options.redis = value === 'true' || value === null;
        return;
    }
    const answer = await new select_1.default('redis?', ['yes', 'no']).run();
    options.redis = answer === 'yes';
    console.log('');
}
async function wsQuestion(args, options) {
    const [wsArg, value] = (0, argAndValue_1.default)('--ws', args);
    if (wsArg) {
        options.ws = value === 'true' || value === null;
        return;
    }
    const answer = await new select_1.default('websockets?', ['yes', 'no']).run();
    options.ws = answer === 'yes';
}
async function clientQuestion(args, options) {
    const [clientArg, value] = (0, argAndValue_1.default)('--client', args);
    if (clientArg && exports.clientTypes.includes(value)) {
        if (value === 'none')
            options.apiOnly = true;
        else
            options.client = value;
        return;
    }
    if (options.apiOnly)
        return;
    const answer = await new select_1.default('which front end client would you like to use?', exports.clientTypes).run();
    if (answer === 'none (api only)') {
        options.apiOnly = true;
    }
    else {
        options.client = answer;
    }
}
async function primaryKeyTypeQuestion(args, options) {
    const [primaryKeyArg, value] = (0, argAndValue_1.default)('--primaryKey', args);
    if (primaryKeyArg && exports.primaryKeyTypes.includes(value)) {
        options.primaryKeyType = value;
        return;
    }
    const answer = await new select_1.default('what primary key type would you like to use?', exports.primaryKeyTypes).run();
    options.primaryKeyType = answer;
}
async function gatherUserInput(args) {
    const options = {
        apiOnly: false,
        redis: false,
        ws: false,
        primaryKeyType: 'bigserial',
        client: null,
    };
    await redisQuestion(args, options);
    await wsQuestion(args, options);
    await clientQuestion(args, options);
    await primaryKeyTypeQuestion(args, options);
    return options;
}
exports.default = gatherUserInput;
