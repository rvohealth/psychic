import path from 'path'
import { PsychicApplication, background } from '@rvohealth/psychic'
import { developmentOrTestEnv, testEnv } from '@rvohealth/dream'
import expressWinston from 'express-winston'
import inflections from './inflections'
import routesCb from './routes'
import winston from 'winston'


export default async (psy: PsychicApplication) => {
  await psy.load('controllers', path.join(__dirname, '..', 'app', 'controllers'))

  psy.set('appName', '<APP_NAME>')
  psy.set('useWs', <USE_WS>)
  psy.set('useRedis', <USE_REDIS>)
  psy.set('apiOnly', <API_ONLY>)
  psy.set('encryption', {
    cookies: {
      current: {
        algorithm: 'aes-256-gcm',
        key: process.env.APP_ENCRYPTION_KEY!,
      },
    },
  })

  psy.set('apiRoot', path.join(__dirname, '..', '..'))
  psy.set('clientRoot', path.join(__dirname, '..', '..', '..', 'client'))
  psy.set('inflections', inflections)
  psy.set('routes', routesCb)

  psy.set('json', {
    limit: '20kb',
  })

  psy.set('ssl', {
    key: process.env.PSYCHIC_SSL_KEY_PATH!,
    cert: process.env.PSYCHIC_SSL_CERT_PATH!,
  })

  psy.set('cors', {
    credentials: true,
    origin: [
      process.env.CLIENT_HOST || 'http://localhost:3000'
    ],
  })

  psy.set('cookie', {
    maxAge: {
      days: 14,
      hours: 0,
      minutes: 0,
      seconds: 0,
      milliseconds: 0,
    },
  })

  psy.set('background', {
    workerCount: parseInt(process.env.WORKER_COUNT || '1'),
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
    username: process.env.BACKGROUND_JOBS_REDIS_USER,
    password: process.env.BACKGROUND_JOBS_REDIS_PASSWORD,
    host: process.env.BACKGROUND_JOBS_REDIS_HOST,
    port: process.env.BACKGROUND_JOBS_REDIS_PORT,
    secure: process.env.BACKGROUND_JOBS_REDIS_USE_SSL === '1',
  })

  // redis websocket credentials
  psy.set('redis:ws', {
    username: process.env.WS_REDIS_USER,
    password: process.env.WS_REDIS_PASSWORD,
    host: process.env.WS_REDIS_HOST,
    port: process.env.WS_REDIS_PORT,
    secure: process.env.WS_REDIS_USE_SSL === '1',
  })

  psy.set('openapi', {})

  // run a callback on server boot (but before routes are processed)
  psy.on('boot', () => {})

  // run a callback when the express server starts. the express app will be passed to each callback as the first argument
  psy.on('server:init', app => {
    if (!testEnv() || process.env.REQUEST_LOGGING === '1') {
      const SENSITIVE_FIELDS = ['password', 'token', 'authentication', 'authorization', 'secret']

      app.use(
        expressWinston.logger({
          transports: [new winston.transports.Console()],
          format: winston.format.combine(winston.format.colorize(), winston.format.json()),
          meta: true, // optional: control whether you want to log the meta data about the request (default to true)
          msg: 'HTTP {{req.method}} {{req.url}}', // optional: customize the default logging message. E.g. "{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}"
          expressFormat: true, // Use the default Express/morgan request formatting. Enabling this will override any msg if true. Will only output colors with colorize set to true
          colorize: false, // Color the text and status code, using the Express/morgan color palette (text: gray, status: default green, 3XX cyan, 4XX yellow, 5XX red).
          headerBlacklist: [
            'authorization',
            'content-length',
            'connection',
            'cookie',
            'sec-ch-ua',
            'sec-ch-ua-mobile',
            'sec-ch-ua-platform',
            'sec-fetch-dest',
            'sec-fetch-mode',
            'sec-fetch-site',
            'user-agent',
          ],
          ignoredRoutes: ['/health_check'],
          bodyBlacklist: SENSITIVE_FIELDS,
        }),
      )
    }
  })


  // run a callback after routes are done processing
  psy.on('after:routes', () => {})

  // run a callback after the config is loaded
  psy.on('load', async () => {
    // uncomment to initialize background jobs
    // (this should only be done if useRedis is true)
    <BACKGROUND_CONNECT>
  })

  // run a callback after the config is loaded, but only if NODE_ENV=development
  psy.on('load:dev', () => {})

  // run a callback after the config is loaded, but only if NODE_ENV=test
  psy.on('load:test', () => {})

  // run a callback after the config is loaded, but only if NODE_ENV=production
  psy.on('load:prod', () => {})

  // this function will be run any time a server error is encountered
  // that psychic isn't sure how to respond to (i.e. 500 internal server errors)
  psy.on('server:error', (err, _, res) => {
    if (!res.headersSent) res.sendStatus(500)
    else if (developmentOrTestEnv()) throw err
  })

  // run a callback after the websocket server is initially started
  psy.on('ws:start', () => {})

  // run a callback after connection to the websocket service
  psy.on('ws:connect', () => {})
}
