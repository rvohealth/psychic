import * as path from 'node:path'
import UnexpectedUndefined from '../error/UnexpectedUndefined.js'
import PsychicApp from '../psychic-app/index.js'

export default function openapiJsonPath(openapiName: string = 'default') {
  const psychicApp = PsychicApp.getOrFail()
  const namedOpenapi = psychicApp.openapi[openapiName]
  if (namedOpenapi === undefined) throw new UnexpectedUndefined()
  return path.join(psychicApp.apiRoot, namedOpenapi.outputFilepath)
}
