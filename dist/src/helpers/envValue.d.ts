export default function envValue(env: AllowedEnv): string;
export declare function envInt(env: AllowedEnv): number | null;
export declare function envBool(env: AllowedBoolEnv): boolean;
export declare function devEnvBool(env: AllowedDevBoolEnv): boolean;
export type AllowedEnv = 'NODE_ENV' | 'APP_ENCRYPTION_KEY' | 'WORKER_COUNT' | 'PSYCHIC_CORE_DEVELOPMENT' | 'AUTH_SESSION_KEY' | 'PORT' | 'DEV_SERVER_PORT';
export type AllowedBoolEnv = 'DEBUG' | 'PSYCHIC_CORE_DEVELOPMENT' | 'TS_SAFE' | 'PSYCHIC_OMIT_DIST_FOLDER' | 'CLIENT' | 'PSYCHIC_DANGEROUSLY_PERMIT_WS_EXCEPTIONS';
export type AllowedDevBoolEnv = 'REALLY_TEST_BACKGROUND_QUEUE' | 'PSYCHIC_EXPECTING_INTERNAL_SERVER_ERROR';
