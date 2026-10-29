import { Env } from '@rvoh/dream'

const EnvInternal = new Env<{
  string: 'SPEC_SERVER_PORT' | 'NODE_ENV'
  integer: 'PORT'
  boolean:
    | 'CLIENT'
    | 'BYPASS_DB_CONNECTIONS_DURING_INIT'
    | 'PSYCHIC_CORE_DEVELOPMENT'
    | 'PSYCHIC_CORE_SPEC_RUN'
}>()

export default EnvInternal
