import { Env } from '@rvoh/dream'

class AppEnvClass extends Env<{
  boolean: 'DEBUG' | 'CLIENT'
}> {}

const AppEnv = new AppEnvClass()
export default AppEnv
