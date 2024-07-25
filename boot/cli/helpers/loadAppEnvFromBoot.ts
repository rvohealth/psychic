import { testEnv } from '@rvohealth/dream'
import dotenv from 'dotenv'

if (process.env.PSYCHIC_CORE_DEVELOPMENT === '1') {
  const dotenvpath = testEnv() ? __dirname + '/../../../.env.test' : __dirname + '/../../../.env'
  dotenv.config({ path: dotenvpath })
} else {
  dotenv.config({
    path: testEnv() ? '../../../.env.test' : '../../../.env',
  })
}
