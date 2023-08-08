import { PsychicRedisConnectionOptions } from '../../../src'

export default async (): Promise<PsychicRedisConnectionOptions> => {
  const user = process.env.REDIS_USER || undefined
  const password = process.env.REDIS_PASSWORD || undefined
  const host = process.env.REDIS_HOST || 'localhost'
  const port = process.env.REDIS_PORT || ''

  return {
    username: user,
    password,
    host,
    port,
    secure: false,
  }
}
