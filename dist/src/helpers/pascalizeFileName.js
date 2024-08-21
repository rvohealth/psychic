"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dream_1 = require("@rvohealth/dream");
function pascalizeFileName(route) {
    return route
        .split('/')
        .map(segment => (0, dream_1.capitalize)((0, dream_1.pascalize)(segment)))
        .join('');
}
exports.default = pascalizeFileName;
