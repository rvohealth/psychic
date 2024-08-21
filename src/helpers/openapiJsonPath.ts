import path from 'path'
import PsychicApplication from '../psychic-application'

export default function openapiJsonPath() {
  const psychicApp = PsychicApplication.getOrFail()
  return path.join(psychicApp.apiRoot, psychicApp.openapi.outputFilename)
}
