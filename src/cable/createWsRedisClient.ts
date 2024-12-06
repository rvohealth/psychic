import Redis from 'ioredis'
import PsychicApplication from '../psychic-application'

let redisWsClientCache: Redis | null = null

export default async function createWsRedisClient(): Promise<Redis> {
  if (redisWsClientCache) return redisWsClientCache

  const psychicApp = PsychicApplication.getOrFail()

  const client = new Redis(psychicApp.redisWebsocketOptions.redis)
  redisWsClientCache = client

  await client.connect()

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any
  return client as any
}
