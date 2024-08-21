/// <reference types="node" />
import { Application } from 'express';
import http from 'http';
import socketio from 'socket.io';
import PsychicApplication from '../psychic-application';
export default class Cable {
    app: Application;
    io: socketio.Server | undefined;
    http: http.Server;
    useRedis: boolean;
    private config;
    constructor(app: Application, config: PsychicApplication);
    connect(): void;
    start(port?: string | number, { withFrontEndClient, frontEndPort, }?: {
        withFrontEndClient?: boolean;
        frontEndPort?: number;
    }): Promise<void>;
    listen({ port, withFrontEndClient, frontEndPort, }: {
        port: number | string;
        withFrontEndClient: boolean;
        frontEndPort: number;
    }): Promise<unknown>;
    bindToRedis(): Promise<void>;
}
