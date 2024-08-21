"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typechecks_1 = require("./typechecks");
function pathifyNestedObject(obj, prefix = '') {
    return Object.keys(obj).reduce((acc, k) => {
        const pre = prefix.length ? prefix + '/' : '';
        if ((0, typechecks_1.isObject)(obj[k]))
            Object.assign(acc, pathifyNestedObject(obj[k], pre + k));
        else
            acc[pre + k] = obj[k];
        return acc;
    }, {});
}
exports.default = pathifyNestedObject;
