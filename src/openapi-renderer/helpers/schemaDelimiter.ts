import openapiOpts from './openapiOpts.js'

/**
 * returns either the delimiter set in the app config, or else a blank string
 */
export default function schemaDelimiter(openapiName: string) {
  return openapiOpts(openapiName)?.schemaDelimeter || ''
}
