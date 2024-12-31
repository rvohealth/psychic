import { Env } from '@rvohealth/dream'

const EnvInternal = new Env<{
  string: 'SPEC_SERVER_PORT' | 'NODE_ENV' | 'PSYCHIC_CORE_DEVELOPMENT'
  integer: 'PORT'
  boolean:
    | 'CLIENT'
    | 'DEBUG'
    | 'PSYCHIC_CORE_DEVELOPMENT'
    | 'PSYCHIC_DANGEROUSLY_PERMIT_WS_EXCEPTIONS'
    | 'BYPASS_DB_CONNECTIONS_DURING_INIT'
    | 'REALLY_TEST_BACKGROUND_QUEUE'
    | 'PSYCHIC_EXPECTING_INTERNAL_SERVER_ERROR'
}>()

export default EnvInternal
