import { developmentOrTestEnv } from '@rvohealth/dream'
import Psyconf from '../../src/psyconf'
import { Encrypt } from '../../src'
import User from '../app/models/User'
import Ws from '../../src/cable/ws'

export default (psy: Psyconf) => {
  // ******
  // CONFIG:
  // ******

  // the name of your application (no spaces)
  psy.appName = 'testapp'

  // the encryption key to use when encrypting
  psy.encryptionKey = process.env.APP_ENCRYPTION_KEY!

  // set to true to leverage internal websocket bindings to socket.io
  psy.useWs = true

  // set to true to leverage internal redis bindings.
  psy.useRedis = true

  // set to true if you want to also attach a client app to your project.
  psy.apiOnly = false

  // set options to configure openapi integration
  psy.set('openapi', {
    defaults: {
      responses: {
        490: {
          $ref: '#/components/responses/CustomResponse',
        },
      },
      components: {
        responses: {
          CustomResponse: {
            description: 'my custom response',
            content: {
              'application/json': {
                schema: {
                  type: 'string',
                },
              },
            },
          },
        },
        schemas: {
          CustomSchema: {
            type: 'string',
          },
        },
      },
    },
  })

  // set options to pass to express.json when middleware is booted
  psy.set('json', {
    limit: '20mb',
  })

  // set options to pass to coors when middleware is booted
  psy.set('cors', {
    credentials: true,
    origin: [process.env.CLIENT_HOST || 'http://localhost:3000'],
  })

  // set options for cookie usage
  psy.set('cookie', {
    maxAge: {
      days: 4,
    },
  })

  // configuration options for bullmq queue (used for running background jobs in redis)
  psy.set('background:queue', {
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
  psy.set('background:worker', {})

  // redis background job credentials
  psy.set('redis:background', {
    username: process.env.REDIS_USER,
    password: process.env.REDIS_PASSWORD,
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    secure: process.env.REDIS_USE_SSL === '1',
  })

  // redis websocket credentials
  psy.set('redis:ws', {
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

  psy.on('server:init', () => {
    __forTestingOnly('server:init')
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
  psy.on('server:error', (err, req, res) => {
    __forTestingOnly('server:error')

    if (!res.headersSent) res.sendStatus(500)
    else if (developmentOrTestEnv()) throw err
  })

  psy.on('ws:start', io => {
    __forTestingOnly('ws:start')

    io.of('/').on('connection', async socket => {
      const token = socket.handshake.auth.token as string
      const userId = Encrypt.decode(token)
      const user = await User.find(userId)

      if (user) {
        // this automatically fires the /ops/connection-success message
        await Ws.register(socket, user.id)
      }
    })
  })

  psy.on('ws:connect', () => {
    __forTestingOnly('ws:connect')
  })
}

export function __forTestingOnly(message: string) {
  process.env.__PSYCHIC_HOOKS_TEST_CACHE ||= ''
  process.env.__PSYCHIC_HOOKS_TEST_CACHE += `,${message}`
}
