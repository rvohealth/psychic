import openapiOpts from './openapiOpts.js'

/**
 * returns whether the named openapi config opts in to the legacy behavior of
 * implicitly exposing all param-safe columns when a model-derived request body
 * is given no `params`/`only`.
 */
export default function legacyImplicitRequestBodyParamsConfig(openapiName: string) {
  return !!openapiOpts(openapiName)?.legacyImplicitRequestBodyParams
}
