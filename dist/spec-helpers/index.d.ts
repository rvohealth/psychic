import '@rvohealth/dream/spec-helpers';
import PsychicServer from '../src/server';
export { SpecRequest } from './spec-request';
export declare function backgroundJobCompletionPromise(): Promise<unknown>;
export declare function createPsychicServer(): Promise<PsychicServer>;
export declare const specRequest: import("./spec-request").SpecRequest;
