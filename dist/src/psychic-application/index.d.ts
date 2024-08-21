import { DreamApplication, OpenapiSchemaBody } from '@rvohealth/dream';
import bodyParser from 'body-parser';
import { QueueOptions } from 'bullmq';
import { CorsOptions } from 'cors';
import { Application, Request, Response } from 'express';
import { Socket, Server as SocketServer } from 'socket.io';
import { OpenapiContent, OpenapiHeaderOption, OpenapiResponses } from '../openapi-renderer/endpoint';
import PsychicRouter from '../router';
import { PsychicRedisConnectionOptions } from './helpers/redisOptions';
import { PsychicHookEventType, PsychicHookLoadEventTypes } from './types';
export default class PsychicApplication {
    static init(cb: (app: PsychicApplication) => void | Promise<void>, dreamCb: (app: DreamApplication) => void | Promise<void>): Promise<PsychicApplication>;
    /**
     * Returns the cached psychic application if it has been set.
     * If it has not been set, an exception is raised.
     *
     * The psychic application can be set by calling PsychicApplication#init
     */
    static getOrFail(): PsychicApplication;
    static loadControllers(controllersPath: string): Promise<Record<string, typeof import("..").PsychicController>>;
    apiOnly: boolean;
    apiRoot: string;
    clientRoot: string;
    useWs: boolean;
    useRedis: boolean;
    appName: string;
    encryptionKey: string;
    port?: number;
    corsOptions: CorsOptions;
    jsonOptions: bodyParser.Options;
    cookieOptions: {
        maxAge: number;
    };
    backgroundQueueOptions: Omit<QueueOptions, 'connection'>;
    backgroundWorkerOptions: WorkerOptions;
    redisBackgroundJobCredentials: PsychicRedisConnectionOptions;
    redisWsCredentials: PsychicRedisConnectionOptions;
    sslCredentials?: PsychicSslCredentials;
    saltRounds?: number;
    routesCb: (r: PsychicRouter) => void | Promise<void>;
    openapi: PsychicOpenapiOptions & Required<Pick<PsychicOpenapiOptions, 'clientOutputFilename' | 'outputFilename' | 'schemaDelimeter'>>;
    client: Required<PsychicClientOptions>;
    paths: Required<PsychicPathOptions>;
    inflections?: () => void | Promise<void>;
    bootHooks: Record<PsychicHookLoadEventTypes, ((conf: PsychicApplication) => void | Promise<void>)[]>;
    specialHooks: PsychicApplicationSpecialHooks;
    protected loadedControllers: boolean;
    get authSessionKey(): string;
    get controllers(): Record<string, typeof import("..").PsychicController>;
    load(resourceType: 'controllers', resourcePath: string): Promise<void>;
    private booted;
    boot(force?: boolean): Promise<void>;
    on<T extends PsychicHookEventType>(hookEventType: T, cb: T extends 'server:error' ? (err: Error, req: Request, res: Response) => void | Promise<void> : T extends 'ws:start' ? (server: SocketServer) => void | Promise<void> : T extends 'ws:connect' ? (socket: Socket) => void | Promise<void> : T extends 'server:init' ? (app: Application) => void | Promise<void> : T extends 'after:routes' ? (app: Application) => void | Promise<void> : (conf: PsychicApplication) => void | Promise<void>): void;
    set<Opt extends PsychicApplicationOption>(option: Opt, value: Opt extends 'cors' ? CorsOptions : Opt extends 'cookie' ? CustomCookieOptions : Opt extends 'apiRoot' ? string : Opt extends 'clientRoot' ? string : Opt extends 'json' ? bodyParser.Options : Opt extends 'client' ? PsychicClientOptions : Opt extends 'background:queue' ? Omit<QueueOptions, 'connection'> : Opt extends 'background:worker' ? WorkerOptions : Opt extends 'redis:background' ? PsychicRedisConnectionOptions : Opt extends 'redis:ws' ? PsychicRedisConnectionOptions : Opt extends 'ssl' ? PsychicSslCredentials : Opt extends 'openapi' ? PsychicOpenapiOptions : Opt extends 'paths' ? PsychicPathOptions : Opt extends 'saltRounds' ? number : Opt extends 'inflections' ? () => void | Promise<void> : Opt extends 'routes' ? (r: PsychicRouter) => void | Promise<void> : never): void;
    private runHooksFor;
}
export type PsychicApplicationOption = 'apiRoot' | 'clientRoot' | 'cors' | 'cookie' | 'json' | 'client' | 'background:queue' | 'background:worker' | 'redis:background' | 'redis:ws' | 'ssl' | 'saltRounds' | 'openapi' | 'paths' | 'controllers' | 'inflections' | 'routes';
export interface PsychicApplicationSpecialHooks {
    expressInit: ((app: Application) => void | Promise<void>)[];
    serverError: ((err: Error, req: Request, res: Response) => void | Promise<void>)[];
    wsStart: ((server: SocketServer) => void | Promise<void>)[];
    wsConnect: ((socket: Socket) => void | Promise<void>)[];
    ['after:routes']: ((app: Application) => void | Promise<void>)[];
}
export interface CustomCookieOptions {
    maxAge?: CustomCookieMaxAgeOptions;
}
export interface CustomCookieMaxAgeOptions {
    milliseconds?: number;
    seconds?: number;
    minutes?: number;
    hours?: number;
    days?: number;
}
export interface PsychicSslCredentials {
    key: string;
    cert: string;
}
export interface PsychicOpenapiOptions {
    schemaDelimeter?: string;
    outputFilename?: `${string}.json`;
    clientOutputFilename?: `${string}.ts`;
    defaults?: {
        headers?: OpenapiHeaderOption[];
        responses?: OpenapiResponses;
        components?: {
            [key: string]: {
                [key: string]: OpenapiSchemaBody | OpenapiContent;
            };
        };
    };
}
interface PsychicPathOptions {
    controllers?: string;
    controllerSpecs?: string;
}
export interface PsychicClientOptions {
    apiPath?: string;
}
export {};
