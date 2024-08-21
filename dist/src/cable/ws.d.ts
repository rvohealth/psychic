import { Dream, IdType } from '@rvohealth/dream';
import { Emitter } from '@socket.io/redis-emitter';
import { Socket } from 'socket.io';
export default class Ws<AllowedPaths extends readonly string[]> {
    allowedPaths: AllowedPaths & readonly string[];
    io: Emitter;
    private redisClient;
    private booted;
    private namespace;
    private redisKeyPrefix;
    static register(socket: Socket, id: IdType | Dream, redisKeyPrefix?: string): Promise<void>;
    constructor(allowedPaths: AllowedPaths & readonly string[], { namespace, redisKeyPrefix, }?: {
        namespace?: string;
        redisKeyPrefix?: string;
    });
    boot(): Promise<void>;
    emit<T extends Ws<AllowedPaths>, const P extends AllowedPaths[number]>(this: T, id: IdType | Dream, path: P, data?: any): Promise<void>;
    findSocketIds(id: IdType): Promise<string[]>;
    private redisKey;
}
export declare class InvalidWsPathError extends Error {
    private invalidPath;
    constructor(invalidPath: string);
    get message(): string;
}
