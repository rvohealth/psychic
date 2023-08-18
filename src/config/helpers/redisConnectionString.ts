import redisOptions, { PsychicRedisConnectionOptions, RedisOptionPurpose } from './redisOptions'

export default async function redisConnectionString(purpose: RedisOptionPurpose) {
  const connectionOptionsCB = await redisOptions(purpose)
  const connectionOptions = await connectionOptionsCB()

  const protocol = connectionOptions.secure ? 'rediss' : 'redis'
  const user = connectionOptions.username || ''
  const password = connectionOptions.password || ''
  const host = connectionOptions.host || 'localhost'
  const port = connectionOptions.port || 6379

  if (user && password) {
    return `${protocol}://${user}:${password}@${host}:${port}`
  } else if (user) {
    return `${protocol}://${user}@${host}:${port}`
  } else {
    return `${protocol}://${host}:${port}`
  }
}
