"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function developmentOrProdEnvString() {
    if (process.env.NODE_ENV === 'production')
        return 'production';
    return 'development';
}
exports.default = developmentOrProdEnvString;
