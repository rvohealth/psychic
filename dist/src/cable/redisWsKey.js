"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function redisWsKey(userId, redisKeyPrefix) {
    return `${redisKeyPrefix}:${userId}:socket_ids`;
}
exports.default = redisWsKey;
