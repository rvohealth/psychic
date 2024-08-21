/// <reference types="node" />
import { Application } from 'express';
import { Server } from 'http';
import Cable from '../cable';
import PsychicApplication from '../psychic-application';
import FrontEndClientServer from './front-end-client';
export default class PsychicServer {
    app: Application;
    cable: Cable;
    frontEndClient: FrontEndClientServer;
    server: Server;
    private booted;
    constructor();
    get config(): PsychicApplication;
    routes(): Promise<import("../router/route-manager").RouteConfig[]>;
    boot(): Promise<true | undefined>;
    start(port?: number, { withFrontEndClient, frontEndPort, }?: {
        withFrontEndClient?: boolean;
        frontEndPort?: number;
    }): Promise<boolean>;
    stop(): Promise<void>;
    serveForRequestSpecs(block: () => void | Promise<void>): Promise<boolean>;
    buildApp(): void;
    private initializeCors;
    private initializeJSON;
    private buildRoutes;
}
