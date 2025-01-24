import path from 'path'
import winston from 'winston'
import EnvInternal from '../../../src/helpers/EnvInternal'
import PsychicApplication from '../../../src/psychic-application'
import inflections from './inflections'
import routesCb from './routes'

export default async (psy: PsychicApplication) => {
  await psy.load('controllers', path.join(__dirname, '..', 'app', 'controllers'))

  psy.set('appName', 'testapp')
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

  psy.set('openapi', 'admin', {
    outputFilename: 'admin.openapi.json',
    syncEnumsToClient: true,
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

  // run a callback on server boot (but before routes are processed)
  psy.on('boot', () => {
    __forTestingOnly('boot')
  })

  psy.on('server:init', () => {
    __forTestingOnly('server:init')
  })

  // run a callback after routes are done processing
  psy.on('server:init:after-routes', () => {
    __forTestingOnly('server:init:after-routes')
  })

  psy.on('server:start', () => {
    __forTestingOnly('server:start')
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

    if (EnvInternal.boolean('DEBUG')) {
      console.error(err)
    }

    if (!res.headersSent) res.sendStatus(500)
    else if (EnvInternal.isDevelopmentOrTest) throw err
  })

  psy.on('server:shutdown', () => {
    __forTestingOnly('server:shutdown')
  })

  psy.on('sync', () => {
    return { customField: { customNestedField: 'custom value' } }
  })
}

export function __forTestingOnly(message: string) {
  process.env.__PSYCHIC_HOOKS_TEST_CACHE ||= ''
  process.env.__PSYCHIC_HOOKS_TEST_CACHE += `,${message}`
}
