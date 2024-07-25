import { getCachedPsyconfOrFail } from '../psyconf/cache'
import { envInt } from './envValue'

export default function portValue() {
  const psyconf = getCachedPsyconfOrFail()
  return psyconf.port || envInt('PORT') || 7777
}
