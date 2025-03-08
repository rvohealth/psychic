import * as dotenv from 'dotenv'
import EnvInternal from './EnvInternal.js'

dotenv.config({ path: EnvInternal.isTest ? '.env.test' : '.env' })
