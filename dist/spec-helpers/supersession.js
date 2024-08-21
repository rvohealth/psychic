"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const methods_1 = __importDefault(require("methods"));
const supertest_1 = __importDefault(require("supertest"));
const http_1 = __importDefault(require("http"));
const url_1 = __importDefault(require("url"));
const cookiejar_1 = require("cookiejar");
class Supersession {
    constructor(server, options = {}) {
        this.options = options;
        if (!server.app) {
            throw new Error('Supersession requires an `app`');
        }
        this.agent = supertest_1.default.agent(server.app, options);
        const app = http_1.default.createServer(server.app);
        const url = supertest_1.default.Test.prototype.serverAddress(app, '/');
        this.app = app;
        this.url = url_1.default.parse(url);
        this.reset();
        // typescript is telling me I don't need to worry about options.helpers,
        // but leaving this commented out in case we need to revisit
        // if (this.options.helpers instanceof Object) {
        //   assign(this, this.options.helpers)
        // }
    }
    get cookies() {
        return this.agent.jar.getCookies(this.cookieAccess);
    }
    reset() {
        // Unset supertest-session options before forwarding options to superagent.
        var agentOptions = {
            ...this.options,
            before: undefined,
            cookieAccess: undefined,
            destroy: undefined,
            helpers: undefined,
        };
        this.agent = supertest_1.default.agent(this.app, agentOptions);
        const domain = this.url.hostname;
        const path = this.url.path;
        const secure = 'https:' == this.url.protocol;
        const script = false;
        this.cookieAccess = cookiejar_1.CookieAccessInfo(domain, path, secure, script);
    }
    destroy() {
        if (this.options.destroy)
            this.options.destroy.call(this);
        this.reset();
    }
    request(method, route) {
        var test = this.agent[method](route);
        // typescript is telling me I don't need to worry about options.before,
        // but leaving this commented out in case we need to revisit
        // if (this.options.before) {
        //   this.options.before.call(this, test)
        // }
        return test;
    }
}
methods_1.default.forEach(function (m) {
    ;
    Supersession.prototype[m] = function () {
        var args = [].slice.call(arguments);
        return this.request.apply(this, [m].concat(args));
    };
});
function supersession(server, config = {}) {
    return new Supersession(server, config);
}
exports.default = supersession;
