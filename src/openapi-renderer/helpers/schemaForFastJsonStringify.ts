import isObject from '../../helpers/isObject.js'

const UNION_KEYWORDS = ['anyOf', 'oneOf']

/**
 * @internal
 *
 * The schema handed to fast-json-stringify for a response schema: the same
 * schema, with each `$ref` that is a direct branch of an `anyOf` or `oneOf`
 * wrapped as `{ allOf: [$ref] }`. The two validate identically, so this
 * changes nothing the schema says; it only works around how
 * fast-json-stringify (6.4 through 7.1) merges schemas.
 *
 * fast-json-stringify serializes an `allOf` by merging its members into one
 * schema, and merges two members that are `anyOf`s into one `anyOf` of every
 * pairing of their branches (`@fastify/merge-json-schemas`, which it calls
 * with `onConflict: 'skip'`). That merger never resolves a `$ref`: a pairing
 * of two different `$ref`s drops the keyword, and a pairing of a `$ref` with
 * another schema keeps the `$ref` alone, which fast-json-stringify then
 * follows, ignoring the other schema. Either way the fields of the referenced
 * schemas are left out of the response, silently. A `$ref` inside an `allOf`
 * survives the pairing (`allOf`s merge by union), and fast-json-stringify
 * resolves it when it compiles the merged branch.
 *
 * A flattened serializer that may be null, or that is an STI base model,
 * renders such an `anyOf` as a member of the flattened `allOf` (see
 * `SerializerOpenapiRenderer`), and hand-written `@OpenAPI` shapes can too,
 * so every `anyOf` and `oneOf` in the schema is rewritten. The OpenAPI
 * document itself is unchanged. The input is not mutated.
 */
export default function schemaForFastJsonStringify<T extends object>(schema: T): T {
  return rewrite(schema) as T
}

function rewrite(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(rewrite)
  if (!isObject(value)) return value

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, keywordValue]) => [
      key,
      UNION_KEYWORDS.includes(key) && Array.isArray(keywordValue)
        ? keywordValue.map(branch => mergeableBranch(rewrite(branch)))
        : rewrite(keywordValue),
    ]),
  )
}

function mergeableBranch(branch: unknown): unknown {
  return isObject(branch) && (branch as { $ref?: unknown }).$ref !== undefined ? { allOf: [branch] } : branch
}
