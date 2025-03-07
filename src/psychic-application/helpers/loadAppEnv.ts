import * as dotenv from 'dotenv'
import EnvInternal from '../../helpers/EnvInternal'

dotenv.config({ path: EnvInternal.isTest ? '../../.env.test' : '../../.env' })
