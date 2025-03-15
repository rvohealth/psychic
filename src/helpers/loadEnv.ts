import * as dotenv from 'dotenv'
import EnvInternal from './EnvInternal.js.js'

dotenv.config({ path: EnvInternal.isTest ? '.env.test' : '.env' })
