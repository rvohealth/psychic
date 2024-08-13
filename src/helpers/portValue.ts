import { getCachedPsychicApplicationOrFail } from '../psychic-application/cache'
import { envInt } from './envValue'

export default function portValue() {
  const psychicApp = getCachedPsychicApplicationOrFail()
  return psychicApp.port || envInt('PORT') || 7777
}
