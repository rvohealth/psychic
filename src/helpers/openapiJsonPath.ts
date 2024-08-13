import path from 'path'
import { getCachedPsychicApplicationOrFail } from '../psychic-application/cache'

export default function openapiJsonPath() {
  const psychicApp = getCachedPsychicApplicationOrFail()
  return path.join(psychicApp.appRoot, psychicApp.openapi?.outputFilename || 'openapi.json')
}
