import supertest, { Response } from 'supertest';
import { HttpMethod } from '../src';
export declare class SpecRequest {
    private server;
    get(uri: string, expectedStatus: number, opts?: SpecRequestOptsGet): Promise<Response>;
    post(uri: string, expectedStatus: number, opts?: SpecRequestOptsPost): Promise<Response>;
    put(uri: string, expectedStatus: number, opts?: SpecRequestOptsPost): Promise<Response>;
    patch(uri: string, expectedStatus: number, opts?: SpecRequestOptsPost): Promise<Response>;
    delete(uri: string, expectedStatus: number, opts?: SpecRequestOptsGet): Promise<Response>;
    init(): Promise<void>;
    session(uri: string, credentials: object, expectedStatus: number, opts?: SpecRequestSessionOpts): Promise<ReturnType<typeof supertest>>;
    private makeRequest;
}
export interface SpecRequestOptsAll extends SpecRequestOpts {
    query?: Record<string, unknown>;
    data?: Record<string, unknown>;
}
export interface SpecRequestOptsGet extends SpecRequestOpts {
    query?: any;
}
export interface SpecRequestOptsPost extends SpecRequestOpts {
    data?: any;
}
export interface SpecRequestOpts {
    headers?: Record<string, string>;
    allowMocks?: boolean;
}
export interface SpecRequestSessionOpts extends SpecRequestOptsAll {
    httpMethod?: HttpMethod;
}
declare const _default: SpecRequest;
export default _default;
