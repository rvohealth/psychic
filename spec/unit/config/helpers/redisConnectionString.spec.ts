import redisConnectionString from '../../../../src/config/helpers/redisConnectionString'
import { RedisOptionPurpose } from '../../../../src/config/helpers/redisOptions'

describe('redisConnectionString', () => {
  let purpose: RedisOptionPurpose
  let username: string | undefined
  let password: string | undefined
  let host: string | undefined
  let port: string | undefined
  let secure: string | undefined
  let originalUsername: string | undefined
  let originalPassword: string | undefined
  let originalHost: string | undefined
  let originalPort: string | undefined
  let originalSecure: string | undefined

  function setTempEnv(key: string, val: string | undefined) {
    if (val) process.env[key] = val
    else delete process.env[key]
  }

  let subject = async () => {
    setTempEnv('REDIS_USER', username)
    setTempEnv('REDIS_PASSWORD', password)
    setTempEnv('REDIS_HOST', host)
    setTempEnv('REDIS_PORT', port)
    setTempEnv('REDIS_USE_SSL', secure)
    return redisConnectionString(purpose)
  }

  beforeEach(() => {
    username = undefined
    password = undefined
    host = undefined
    port = undefined
    secure = undefined
    originalUsername = process.env.REDIS_USER
    originalPassword = process.env.REDIS_PASSWORD
    originalHost = process.env.REDIS_HOST
    originalPort = process.env.REDIS_PORT
    originalSecure = process.env.REDIS_USE_SSL
  })

  afterEach(() => {
    setTempEnv('REDIS_USER', originalUsername)
    setTempEnv('REDIS_PASSWORD', originalPassword)
    setTempEnv('REDIS_HOST', originalHost)
    setTempEnv('REDIS_PORT', originalPort)
    setTempEnv('REDIS_USE_SSL', originalSecure)
  })

  beforeEach(() => {
    purpose = 'ws'
  })

  describe('context: with no env vars set', () => {
    it('returns a properly-formatted connection string', async () => {
      expect(await subject()).toEqual('redis://localhost:6379')
    })
  })

  describe('context: with a username and password', () => {
    beforeEach(() => {
      username = 'fred'
      password = 'passw0rd!'
    })

    it('returns a properly-formatted connection string', async () => {
      expect(await subject()).toEqual('redis://fred:passw0rd!@localhost:6379')
    })
  })

  describe('context: with only a username', () => {
    beforeEach(() => {
      username = 'fred'
    })

    it('returns a properly-formatted connection string', async () => {
      expect(await subject()).toEqual('redis://fred@localhost:6379')
    })
  })

  describe('context: with a port', () => {
    beforeEach(() => {
      port = '1234'
    })

    it('returns a properly-formatted connection string', async () => {
      expect(await subject()).toEqual('redis://localhost:1234')
    })
  })
})
