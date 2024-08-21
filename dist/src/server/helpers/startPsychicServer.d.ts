/// <reference types="node" />
/// <reference types="node" />
import { Application } from 'express';
import http, { Server } from 'http';
import https from 'https';
import { PsychicSslCredentials } from '../../psychic-application';
export default function startPsychicServer({ app, port, withFrontEndClient, frontEndPort, sslCredentials, }: {
    app: Application;
    port: number;
    withFrontEndClient: boolean;
    frontEndPort: number;
    sslCredentials: PsychicSslCredentials | undefined;
}): Promise<Server>;
export declare function getPsychicHttpInstance(app: Application, sslCredentials: PsychicSslCredentials | undefined): http.Server<typeof http.IncomingMessage, typeof http.ServerResponse> | https.Server<typeof http.IncomingMessage, typeof http.ServerResponse>;
