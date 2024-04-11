import { developmentOrTestEnv } from '@rvohealth/dream'
import PsychicConfig from '../../src/config'

export default (psy: PsychicConfig) => {
  // ******
  // CONFIG:
  // ******

  // the name of your application (no spaces)
  psy.appName = 'testapp'

  // set to true to leverage internal websocket bindings to socket.io
  psy.useWs = true

  // set to true to leverage internal redis bindings.
  psy.useRedis = true

  // set to true if you want to also attach a client app to your project.
  psy.apiOnly = false

  // set options to pass to express.json when middleware is booted
  psy.setJsonOptions({
    limit: '20mb',
  })

  // set options to pass to coors when middleware is booted
  psy.setCorsOptions({
    credentials: true,
    origin: [
      process.env.CLIENT_HOST ||
        (process.env.NODE_ENV === 'test' ? 'http://localhost:7778' : 'http://localhost:3000'),
    ],
  })

  // configuration options for bullmq queue (used for running background jobs in redis)
  psy.setBackgroundQueueOptions({
    defaultJobOptions: {
      removeOnComplete: 1000,
      removeOnFail: 20000,
      // 524,288,000 ms (~6.1 days) using algorithm:
      // "2 ^ (attempts - 1) * delay"
      attempts: 20,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    },
  })

  // configuration options for bullmq worker (used for running background jobs in redis)
  psy.setBackgroundWorkerOptions({})

  // redis background job credentials
  psy.setRedisBackgroundJobCredentials({
    username: process.env.REDIS_USER,
    password: process.env.REDIS_PASSWORD,
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    secure: process.env.REDIS_USE_SSL === '1',
  })

  // redis websocket credentials
  psy.setRedisWsCredentials({
    username: process.env.REDIS_USER,
    password: process.env.REDIS_PASSWORD,
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    secure: process.env.REDIS_USE_SSL === '1',
  })

  // ******
  // HOOKS:
  // ******

  // run a callback on server boot (but before routes are processed)
  psy.on('boot', () => {
    __forTestingOnly('boot')
  })

  // run a callback after routes are done processing
  psy.on('after:routes', () => {
    __forTestingOnly('after:routes')
  })

  // run a callback after the config is loaded
  psy.on('load', () => {
    __forTestingOnly('load')
  })

  // run a callback after the config is loaded, but only if NODE_ENV=development
  psy.on('load:dev', () => {
    __forTestingOnly('load:dev')
  })

  // run a callback after the config is loaded, but only if NODE_ENV=test
  psy.on('load:test', () => {
    __forTestingOnly('load:test')
  })

  // run a callback after the config is loaded, but only if NODE_ENV=prod
  psy.on('load:prod', () => {
    __forTestingOnly('load:prod')
  })

  // run a callback after the config is loaded, but only if NODE_ENV=prod
  psy.on('server_error', (err, req, res) => {
    __forTestingOnly('server_error')

    if (!res.headersSent) res.sendStatus(500)
    else if (developmentOrTestEnv()) throw err
  })

  psy.on('ws:start', () => {
    __forTestingOnly('ws:start')
  })

  psy.on('ws:connect', () => {
    __forTestingOnly('ws:connect')
  })
}

export function __forTestingOnly(message: string) {
  process.env.__PSYCHIC_HOOKS_TEST_CACHE ||= ''
  process.env.__PSYCHIC_HOOKS_TEST_CACHE += `,${message}`
}
