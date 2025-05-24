import PsychicApp, { NamedPsychicOpenapiOptions } from '../../psychic-app/index.js'

export default function openapiOpts(openapiName: string): NamedPsychicOpenapiOptions {
  const psychicApp = PsychicApp.getOrFail()
  if (!psychicApp.openapi[openapiName]) throw new Error(`missing openapi settings for name: "${openapiName}"`)
  return psychicApp.openapi[openapiName]
}
