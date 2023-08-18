import { PsychicRedisConnectionOptions } from '../../../src'

export default async (): Promise<PsychicRedisConnectionOptions> => {
  const user = process.env.REDIS_USER
  const password = process.env.REDIS_PASSWORD
  const host = process.env.REDIS_HOST
  const port = process.env.REDIS_PORT

  return {
    username: user,
    password,
    host,
    port,
    secure: false,
  }
}
