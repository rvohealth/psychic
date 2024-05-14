import { Settings } from 'luxon'
import * as dotenv from 'dotenv'

dotenv.config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env' })

Settings.defaultZone = 'UTC'
