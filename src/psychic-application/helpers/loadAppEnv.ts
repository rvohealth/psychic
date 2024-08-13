import { testEnv } from '@rvohealth/dream'
import dotenv from 'dotenv'

dotenv.config({ path: testEnv() ? '../../.env.test' : '../../.env' })
