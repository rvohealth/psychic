"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const encrypt_1 = __importDefault(require("../encryption/encrypt"));
const cookieMaxAgeFromCookieOpts_1 = __importDefault(require("../helpers/cookieMaxAgeFromCookieOpts"));
const envValue_1 = __importDefault(require("../helpers/envValue"));
const psychic_application_1 = __importDefault(require("../psychic-application"));
class Session {
    constructor(req, res) {
        this.req = req;
        this.res = res;
    }
    getCookie(name) {
        const cookies = this.req.cookies;
        const value = cookies[name];
        if (value)
            return encrypt_1.default.decode(value);
        return null;
    }
    setCookie(name, data, opts = {}) {
        this.res.cookie(name, encrypt_1.default.sign(data), {
            secure: (0, envValue_1.default)('NODE_ENV') === 'production',
            httpOnly: true,
            ...opts,
            maxAge: opts.maxAge
                ? (0, cookieMaxAgeFromCookieOpts_1.default)(opts.maxAge)
                : psychic_application_1.default.getOrFail().cookieOptions?.maxAge,
        });
    }
    clearCookie(name) {
        this.res.clearCookie(name);
    }
    daysToMilliseconds(numDays) {
        return numDays * 60 * 60 * 24 * 1000;
    }
}
exports.default = Session;
