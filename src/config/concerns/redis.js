const RedisConfigProvider = superclass => class extends superclass {
  get redis() {
    return this._redisConfig
  }

  get redisPort() {
    return this.redis.port || '999'
  }

  get redisHost() {
    return this.redis.host || 'localhost'
  }

  get redisDB() {
    return this.redis.db || 0
  }

  get redisPassword() {
    return this.redis.password || ''
  }
}

export default RedisConfigProvider
