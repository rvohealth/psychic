export interface PsychicRedisConnectionOptions {
    secure?: boolean;
    host?: string;
    port?: string;
    username?: string;
    password?: string;
}
export type RedisOptionPurpose = 'ws' | 'background_jobs';
export default function redisOptions(purpose: RedisOptionPurpose): PsychicRedisConnectionOptions;
