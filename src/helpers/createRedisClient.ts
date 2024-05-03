import { createClient, RedisClientOptions } from 'redis'
import redisOptions from '../config/helpers/redisOptions'

const redisClientCache: Record<'ws' | 'background_jobs', ReturnType<typeof createClient> | null> = {
  ws: null,
  background_jobs: null,
}

export default async function createRedisClient(
  purpose: 'ws' | 'background_jobs',
): Promise<ReturnType<typeof createClient>> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any
  if (redisClientCache[purpose]) return redisClientCache[purpose] as any

  const redisOpts = await redisOptions(purpose)

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
  redisClientCache[purpose] = client

  await client.connect()

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any
  return client as any
}
