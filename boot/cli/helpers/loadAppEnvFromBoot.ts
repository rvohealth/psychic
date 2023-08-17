import dotenv from 'dotenv'

if (process.env.PSYCHIC_CORE_DEVELOPMENT === '1') {
  const dotenvpath =
    process.env.NODE_ENV === 'test' ? __dirname + '/../../../.env.test' : __dirname + '/../../../.env'
  dotenv.config({ path: dotenvpath })
} else {
  dotenv.config({
    path: process.env.NODE_ENV === 'test' ? '../../.env.test' : '../../.env',
  })
}
