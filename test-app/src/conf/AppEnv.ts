import { Env } from '@rvoh/dream'

class AppEnvClass extends Env<{
  boolean: 'CLIENT'
  string: 'APP_ENCRYPTION_KEY'
}> {}

const AppEnv = new AppEnvClass()
export default AppEnv
