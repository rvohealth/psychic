"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isUuid(val) {
    if (typeof val !== 'string')
        return false;
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(val);
}
exports.default = isUuid;
