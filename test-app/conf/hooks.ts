import PsychicConfig from '../../src/config'

export default async (psyConf: PsychicConfig) => {
  // run a callback on server boot (but before routes are processed)
  psyConf.on('boot', conf => {
    __forTestingOnly('boot')
  })

  // run a callback after routes are done processing
  psyConf.on('after:routes', conf => {
    __forTestingOnly('after:routes')
  })

  // run a callback after the config is loaded
  psyConf.on('load', conf => {
    __forTestingOnly('load')
  })

  // run a callback after the config is loaded, but only if NODE_ENV=development
  psyConf.on('load:dev', conf => {
    __forTestingOnly('load:dev')
  })

  // run a callback after the config is loaded, but only if NODE_ENV=test
  psyConf.on('load:test', conf => {
    __forTestingOnly('load:test')
  })

  // run a callback after the config is loaded, but only if NODE_ENV=prod
  psyConf.on('load:prod', conf => {
    __forTestingOnly('load:prod')
  })

  // run a callback after the config is loaded, but only if NODE_ENV=prod
  psyConf.on('server_error', (err, req, res) => {
    __forTestingOnly('server_error')
  })
}

export function __forTestingOnly(message: string) {
  ;(process.env as any).__PSYCHIC_HOOKS_TEST_CACHE ||= ''
  ;(process.env as any).__PSYCHIC_HOOKS_TEST_CACHE += `,${message}`
}
