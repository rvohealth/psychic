import { createClient, RedisClientOptions } from 'redis'
import redisOptions from '../psychic-application/helpers/redisOptions'

let redisWsClientCache: ReturnType<typeof createClient> | null = null

export default async function createWsRedisClient(): Promise<ReturnType<typeof createClient>> {
  if (redisWsClientCache) return redisWsClientCache

  const redisOpts = redisOptions('ws')

  const creds = {
    username: redisOpts.username,
    password: redisOpts.password,
    socket: {
      host: redisOpts.host,
      port: redisOpts.port ? parseInt(redisOpts.port) : 6379,
      tls: (!!redisOpts.secure || undefined) as true,
      rejectUnauthorized: !!redisOpts.secure,
    },
  } as RedisClientOptions

  const client = createClient(creds)
  redisWsClientCache = client

  await client.connect()

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any
  return client as any
}
