import PsychicApplication from '../psychic-application'
import { envInt } from './envValue'

export default function portValue() {
  const psychicApp = PsychicApplication.getOrFail()
  return psychicApp.port || envInt('PORT') || 7777
}
