"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sspawn_1 = require("../helpers/sspawn");
class FrontEndClientServer {
    start(port = 3000) {
        this.child = (0, sspawn_1.ssspawn)(`PORT=${port} yarn client`, { stdio: 'ignore' });
    }
    stop() {
        if (!this.child)
            return;
        this.child.kill();
    }
}
exports.default = FrontEndClientServer;
