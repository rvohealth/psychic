import { DreamCLI } from '@rvoh/dream'
import session from 'express-session'
import * as path from 'node:path'
import { debuglog } from 'node:util'
import passport from 'passport'
import { Strategy as LocalStrategy } from 'passport-local'
import * as winston from 'winston'
import EnvInternal from '../../../src/helpers/EnvInternal.js'
import { PsychicDevtools } from '../../../src/index.js'
import PsychicApp from '../../../src/psychic-app/index.js'
import importDefault from '../app/helpers/importDefault.js'
import srcPath from '../app/helpers/srcPath.js'
import User from '../app/models/User.js'
import AppEnv from './AppEnv.js'
import inflections from './inflections.js'
import routesCb from './routes.js'
import { RequestHandler } from 'express'

const debugEnabled = debuglog('psychic').enabled

export default async (psy: PsychicApp) => {
  await psy.load('controllers', srcPath('app', 'controllers'), path => importDefault(path))
  await psy.load('services', srcPath('app', 'services'), path => importDefault(path))
  await psy.load('initializers', srcPath('conf', 'initializers'), path => importDefault(path))

  psy.set('appName', 'testapp')
  psy.set('packageManager', 'yarn')
  psy.set('apiOnly', false)
  psy.set('apiRoot', srcPath('..', '..'))
  psy.set('clientRoot', srcPath('..', 'client'))
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

  if (AppEnv.isProduction) {
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
          new winston.transports.File({
            filename: 'error.log',
            // level: 'error'
          }),
          new winston.transports.File({ filename: 'combined.log' }),
        ],
      }),
    )
  }

  psy.set('paths', {
    apiRoutes: 'test-app/src/conf/routes.ts',
    controllers: 'test-app/src/app/controllers',
    services: 'test-app/src/app/services',
    controllerSpecs: 'test-app/spec/unit/controllers',
  })

  // set options to configure openapi integration
  psy.set('openapi', {
    outputFilepath: path.join('test-app', 'src', 'openapi', 'openapi.json'),
    servers: [{ url: 'howyadoin.com', variables: { region: { default: 'a', enum: ['a', 'b'] } } }],
    syncTypes: true,
    defaults: {
      headers: {
        ['custom-header']: {
          required: true,
          description: 'custom header',
        },
      },

      responses: {
        418: {
          $ref: '#/components/responses/CustomResponse',
        },
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

  psy.set('openapi', 'mobile', {
    outputFilepath: path.join('test-app', 'src', 'openapi', 'mobile.openapi.json'),
    suppressResponseEnums: true,
  })

  psy.set('openapi', 'admin', {
    info: {
      title: 'admin',
      description: 'admin desc',
      version: '1.1.1',
    },
    outputFilepath: path.join('test-app', 'src', 'openapi', 'admin.openapi.json'),
    defaults: {
      headers: {
        ['custom-admin-header']: {
          required: true,
          description: 'custom admin header',
        },
      },

      responses: {
        490: {
          $ref: '#/components/responses/CustomAdminResponse',
        },
      },

      securitySchemes: {
        bearerToken: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'custom admin auth token',
        },
      },

      security: [{ bearerToken: [] }],

      components: {
        responses: {
          CustomAdminResponse: {
            description: 'my custom admin response',
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
          CustomAdminSchema: {
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

  // ******
  // HOOKS:
  // ******
  psy.use((_, __, next) => {
    __forTestingOnly('use')
    next()
  })

  psy.use('before-middleware', (_, __, next) => {
    __forTestingOnly('use:before-middleware')
    next()
  })

  psy.use('after-middleware', (_, __, next) => {
    __forTestingOnly('use:after-middleware')
    next()
  })

  // run a callback on server boot (but before routes are processed)
  psy.on('server:init:before-middleware', () => {
    __forTestingOnly('server:init:before-middleware')
  })

  psy.on('server:init:after-middleware', () => {
    __forTestingOnly('server:init:after-middleware')
  })

  // run a callback after routes are done processing
  psy.on('server:init:after-routes', () => {
    __forTestingOnly('server:init:after-routes')
  })

  // run a callback after the config is loaded, but only if NODE_ENV=prod
  psy.on('server:error', (err, _, res) => {
    __forTestingOnly('server:error')

    if (debugEnabled) {
      console.error(err)
    }

    if (!res.headersSent) res.sendStatus(500)
    else if (EnvInternal.isDevelopmentOrTest) throw err
  })

  psy.on('server:start', async () => {
    __forTestingOnly('server:start')

    if (AppEnv.isDevelopment && AppEnv.boolean('CLIENT')) {
      DreamCLI.logger.logStartProgress('dev server starting...')

      await PsychicDevtools.launchDevServer('devReactApp', { port: 3000, cmd: 'yarn client' })

      DreamCLI.logger.logEndProgress()
    }
  })

  psy.on('server:shutdown', () => {
    __forTestingOnly('server:shutdown')

    if (AppEnv.isDevelopment && AppEnv.boolean('CLIENT')) {
      DreamCLI.logger.logStartProgress('dev server closing...')

      PsychicDevtools.stopDevServer('devReactApp')

      DreamCLI.logger.logEndProgress()
    }
  })

  psy.on('cli:sync', () => {
    return { customField: { customNestedField: 'custom value' } }
  })

  // begin: passport test setup
  psy.use(
    session({
      secret: AppEnv.string('APP_ENCRYPTION_KEY'),
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: AppEnv.isProduction, // Only use secure cookies in production
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    }),
  )
  psy.use(passport.initialize())
  psy.use(passport.session() as RequestHandler)
  passport.serializeUser((user: User, done) => {
    done(null, user.id)
  })
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await User.findOrFail(id)
      done(null, user)
    } catch (error) {
      done(error)
    }
  })
  passport.use(
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    new LocalStrategy(async (email, password, cb) => {
      const user = await User.findBy({ email })
      if (!user) return cb(false)
      if (!(await user.checkPassword(password))) return cb(false)
      return cb(null, user)
    }),
  )
  // end: passport test setup
}

export function __forTestingOnly(message: string) {
  process.env.__PSYCHIC_HOOKS_TEST_CACHE ||= ''
  process.env.__PSYCHIC_HOOKS_TEST_CACHE += `,${message}`
}
