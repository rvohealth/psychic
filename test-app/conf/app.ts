import PsychicConfig from '../../src/config'

export default async (psy: PsychicConfig) => {
  // the name of your application (no spaces)
  psy.appName = 'testapp'

  // set to true to leverage internal websocket bindings to socket.io
  psy.useWs = false

  // set to true to leverage internal redis bindings.
  // NOTE: if useWs is also true, then psychic will also create
  // bindings between redis and socket.io, allowing for a scalable,
  // distributed ws pattern
  psy.useRedis = false

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

  // run a callback on server boot (but before routes are processed)
  psy.on('boot', conf => {
    __forTestingOnly('boot')
  })

  // run a callback after routes are done processing
  psy.on('after:routes', conf => {
    __forTestingOnly('after:routes')
  })

  // run a callback after the config is loaded
  psy.on('load', conf => {
    __forTestingOnly('load')
  })

  // run a callback after the config is loaded, but only if NODE_ENV=development
  psy.on('load:dev', conf => {
    __forTestingOnly('load:dev')
  })

  // run a callback after the config is loaded, but only if NODE_ENV=test
  psy.on('load:test', conf => {
    __forTestingOnly('load:test')
  })

  // run a callback after the config is loaded, but only if NODE_ENV=prod
  psy.on('load:prod', conf => {
    __forTestingOnly('load:prod')
  })

  // run a callback after the config is loaded, but only if NODE_ENV=prod
  psy.on('server_error', (err, req, res) => {
    __forTestingOnly('server_error')
  })
}

export function __forTestingOnly(message: string) {
  ;(process.env as any).__PSYCHIC_HOOKS_TEST_CACHE ||= ''
  ;(process.env as any).__PSYCHIC_HOOKS_TEST_CACHE += `,${message}`
}
