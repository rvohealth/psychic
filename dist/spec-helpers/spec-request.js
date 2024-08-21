"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpecRequest = void 0;
const supertest_1 = __importDefault(require("supertest"));
const _1 = require(".");
const supersession_1 = __importDefault(require("./supersession"));
class SpecRequest {
    async get(uri, expectedStatus, opts = {}) {
        return await this.makeRequest('get', uri, expectedStatus, opts);
    }
    async post(uri, expectedStatus, opts = {}) {
        return await this.makeRequest('post', uri, expectedStatus, opts);
    }
    async put(uri, expectedStatus, opts = {}) {
        return await this.makeRequest('put', uri, expectedStatus, opts);
    }
    async patch(uri, expectedStatus, opts = {}) {
        return await this.makeRequest('patch', uri, expectedStatus, opts);
    }
    async delete(uri, expectedStatus, opts = {}) {
        return await this.makeRequest('delete', uri, expectedStatus, opts);
    }
    async init() {
        this.server ||= await (0, _1.createPsychicServer)();
    }
    async session(uri, credentials, expectedStatus, opts = {}) {
        return await new Promise((accept, reject) => {
            (0, _1.createPsychicServer)()
                .then(server => {
                const session = (0, supersession_1.default)(server);
                session[(opts.httpMethod || 'post')](uri)
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    .send(credentials)
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    .expect(expectedStatus)
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    .query(opts.query || {})
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    .set(opts.headers || {})
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    .end((err) => {
                    if (err)
                        return reject(err);
                    return accept(session);
                });
            })
                .catch(() => null);
        });
    }
    async makeRequest(method, uri, expectedStatus, opts = {}) {
        // TODO: find out why this is necessary. Currently, without initializing the server
        // at the beginning of the specs, supertest is unable to use our server to handle requests.
        // it gives the appearance of being an issue with a runaway promise (i.e. missing await)
        // but I can't find it anywhere, so I am putting this init method in as a temporary fix.
        if (!this.server)
            throw new Error(`
  ERROR:
    When making use of the send spec helper, you must first call "await specRequest.init()"
    from a beforEach hook at the root of your specs.
`);
        if (expectedStatus === 500) {
            process.env.PSYCHIC_EXPECTING_INTERNAL_SERVER_ERROR = '1';
        }
        const req = supertest_1.default.agent(this.server.app);
        let request = req[method](uri);
        if (opts.headers)
            request = request.set(opts.headers);
        if (opts.query)
            request = request.query(opts.query);
        if (method !== 'get')
            request = request.send(opts.data);
        try {
            const res = await request.expect(expectedStatus);
            process.env.PSYCHIC_EXPECTING_INTERNAL_SERVER_ERROR = undefined;
            return res;
        }
        catch (err) {
            // without manually console logging, you get no stack trace here
            console.error(err);
            console.trace();
            process.env.PSYCHIC_EXPECTING_INTERNAL_SERVER_ERROR = undefined;
            throw err;
        }
    }
}
exports.SpecRequest = SpecRequest;
exports.default = new SpecRequest();
