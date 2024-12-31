import dotenv from 'dotenv'
import EnvInternal from './EnvInternal'

dotenv.config({ path: EnvInternal.isTest ? '.env.test' : '.env' })
