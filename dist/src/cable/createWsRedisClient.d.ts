import { createClient } from 'redis';
export default function createWsRedisClient(): Promise<ReturnType<typeof createClient>>;
