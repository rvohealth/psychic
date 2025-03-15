import * as path from 'path'
import PsychicApplication from '../psychic-application/index.js.js'

export default function openapiJsonPath(openapiName: string = 'default') {
  const psychicApp = PsychicApplication.getOrFail()
  return path.join(psychicApp.apiRoot, psychicApp.openapi[openapiName].outputFilename)
}
