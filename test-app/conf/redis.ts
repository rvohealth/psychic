export default async () => {
  const user = process.env.REDIS_USER || undefined
  const password = process.env.REDIS_PASSWORD || undefined
  const host = process.env.REDIS_HOST || 'localhost'
  const port = process.env.REDIS_PORT || ''
  // const protocol = process.env.REDIS_PROTOCOL || 'redis'

  return {
    user,
    password,
    host,
    port,
  }
}
