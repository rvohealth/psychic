import { developmentOrTestEnv, Encrypt } from '@rvohealth/dream'
import { Queue, QueueEvents, Worker } from 'bullmq'
import Redis from 'ioredis'
import path from 'path'
import winston from 'winston'
import Ws from '../../../src/cable/ws'
import PsychicApplication from '../../../src/psychic-application'
import User from '../app/models/User'
import inflections from './inflections'
import routesCb from './routes'

export default async (psy: PsychicApplication) => {
  await psy.load('controllers', path.join(__dirname, '..', 'app', 'controllers'))

  psy.set('appName', 'testapp')
  psy.set('useWs', true)
  psy.set('useRedis', true)
  psy.set('apiOnly', false)
  psy.set('apiRoot', path.join(__dirname, '..', '..', '..'))
  psy.set('clientRoot', path.join(__dirname, '..', '..', 'client'))
  psy.set('inflections', inflections)
  psy.set('routes', routesCb)
  psy.set('encryption', {
    cookies: {
      current: {
        algorithm: 'aes-256-gcm',
        key: process.env.APP_ENCRYPTION_KEY!,
      },
      legacy: {
        algorithm: 'aes-256-gcm',
        key: process.env.LEGACY_APP_ENCRYPTION_KEY!,
      },
    },
  })

  psy.set(
    'logger',
    winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      defaultMeta: { service: 'user-service' },
      transports: [
        //
        // - Write all logs with importance level of `error` or less to `error.log`
        // - Write all logs with importance level of `info` or less to `combined.log`
        //
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
      ],
    }),
  )

  psy.set('paths', {
    apiRoutes: 'test-app/src/conf/routes.ts',
    controllers: 'test-app/src/app/controllers',
    controllerSpecs: 'test-app/spec/unit/controllers',
  })

  // set options to configure openapi integration
  psy.set('openapi', {
    syncEnumsToClient: true,
    defaults: {
      headers: {
        ['custom-header']: {
          required: true,
          description: 'custom header',
        },
      },

      responses: {
        490: {
          $ref: '#/components/responses/CustomResponse',
        },
      },

      securitySchemes: {
        bearerToken: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'custom auth token',
        },
      },

      security: [{ bearerToken: [] }],

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

  psy.set('background', {
    providers: {
      Queue,
      Worker,
      QueueEvents,
    },

    defaultBullMQQueueOptions: {
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
    },

    // Psychic background API
    defaultWorkstream: {
      // https://docs.bullmq.io/guide/parallelism-and-concurrency
      workerCount: parseInt(process.env.WORKER_COUNT || '0'),
      concurrency: 100,
    },

    namedWorkstreams: [{ workerCount: 1, name: 'snazzy', rateLimit: { max: 1, duration: 1 } }],
    // end: Psychic background API

    // // native BullMQ background API
    // nativeBullMQ: {
    //   // defaultQueueOptions: {connection: }
    //   namedQueueOptions: {
    //     snazzy: {},
    //   },
    //   namedQueueWorkers: { snazzy: {} },
    // },
    // // end: native BullMQ background API

    // transitionalWorkstreams: {
    //   defaultQueueConnection: new Redis({
    //     username: process.env.REDIS_USER,
    //     password: process.env.REDIS_PASSWORD,
    //     host: process.env.REDIS_HOST,
    //     port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : undefined,
    //     tls: process.env.REDIS_USE_SSL === '1' ? {} : undefined,
    //     enableOfflineQueue: false,
    //   }),
    //   defaultWorkerConnection: new Redis({
    //     username: process.env.REDIS_USER,
    //     password: process.env.REDIS_PASSWORD,
    //     host: process.env.REDIS_HOST,
    //     port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : undefined,
    //     tls: process.env.REDIS_USE_SSL === '1' ? {} : undefined,
    //     maxRetriesPerRequest: null,
    //   }),

    //   namedWorkstreams: [
    //     {
    //       workerCount: 1,
    //       name: 'snazzy',
    //       rateLimit: { max: 1, duration: 1 },
    //     },
    //   ],
    // },

    defaultQueueConnection: new Redis({
      username: process.env.REDIS_USER,
      password: process.env.REDIS_PASSWORD,
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : undefined,
      tls: process.env.REDIS_USE_SSL === '1' ? {} : undefined,
      enableOfflineQueue: false,
    }),

    defaultWorkerConnection: new Redis({
      username: process.env.REDIS_USER,
      password: process.env.REDIS_PASSWORD,
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : undefined,
      tls: process.env.REDIS_USE_SSL === '1' ? {} : undefined,
      maxRetriesPerRequest: null,
    }),

    // To set up a simple cluster on a dev machine for testing:
    //   https://medium.com/@bertrandoubida/setting-up-redis-cluster-on-macos-cf35a21465a
    // defaultQueueConnection: new Cluster(
    //   [6380, 6384, 6385, 6381, 6383, 6382].map(port => ({ host: '127.0.0.1', port })),
    //   {
    //     redisOptions: {
    //       username: process.env.REDIS_USER,
    //       password: process.env.REDIS_PASSWORD,
    //       tls: process.env.REDIS_USE_SSL === '1' ? {} : undefined,
    //     },
    //     enableOfflineQueue: false
    //   },
    // ),
    // defaultWorkerConnection: new Cluster(
    //   [6380, 6384, 6385, 6381, 6383, 6382].map(port => ({ host: '127.0.0.1', port })),
    //   {
    //     redisOptions: {
    //       username: process.env.REDIS_USER,
    //       password: process.env.REDIS_PASSWORD,
    //       tls: process.env.REDIS_USE_SSL === '1' ? {} : undefined,
    //       maxRetriesPerRequest: null,
    //     },
    //   },
    // ),
  })

  // redis websocket credentials
  psy.set('websockets', {
    connection: new Redis({
      username: process.env.REDIS_USER,
      password: process.env.REDIS_PASSWORD,
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : undefined,
      tls: process.env.REDIS_USE_SSL === '1' ? {} : undefined,
      maxRetriesPerRequest: null,
    }),
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
      const userId = Encrypt.decrypt(token, {
        algorithm: 'aes-256-gcm',
        key: process.env.APP_ENCRYPTION_KEY!,
      })
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
