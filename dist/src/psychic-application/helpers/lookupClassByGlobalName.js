"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dream_1 = require("@rvohealth/dream");
const loadControllers_1 = require("./loadControllers");
function lookupClassByGlobalName(name) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const lookup = (0, dream_1.lookupClassByGlobalName)(name);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    if (lookup)
        return lookup;
    const combinedObj = {
        ...(0, loadControllers_1.getControllersOrFail)(),
    };
    return combinedObj[name] || null;
}
exports.default = lookupClassByGlobalName;
