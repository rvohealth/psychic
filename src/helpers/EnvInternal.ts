import { Env } from '@rvoh/dream'

const EnvInternal = new Env<{
  string: 'SPEC_SERVER_PORT' | 'NODE_ENV'
  integer: 'PORT'
  boolean: 'CLIENT' | 'PSYCHIC_DANGEROUSLY_PERMIT_WS_EXCEPTIONS' | 'BYPASS_DB_CONNECTIONS_DURING_INIT'
}>()

export default EnvInternal
