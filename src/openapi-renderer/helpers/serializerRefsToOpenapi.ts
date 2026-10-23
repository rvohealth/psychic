import { OpenapiSchemaBody, OpenapiSchemaExpressionRef } from '@rvoh/dream/openapi'

/**
 * @internal
 *
 * The schema for a `{ $serializer | $serializable, many?, maybeNull? }`
 * shorthand, once its serializers are resolved to `$ref`s:
 *
 * - one ref is used as is; several (the children of an STI base model) are
 *   `anyOf` the refs
 * - `many` makes it an array of that, nullable when `maybeNull` is also set
 * - `maybeNull` without `many` adds `{ type: 'null' }` to the refs' `anyOf`
 *
 * Both the serializer renderer (`allSerializersToRefsInOpenapi`) and the
 * `@OpenAPI` shorthand expander (`OpenapiSegmentExpander`) build these
 * shapes here, so the two agree.
 */
export default function serializerRefsToOpenapi(
  refs: OpenapiSchemaExpressionRef[],
  { many, maybeNull }: { many?: boolean | undefined; maybeNull?: boolean | undefined },
): OpenapiSchemaBody {
  const refOrAnyOfRefs: OpenapiSchemaBody = refs.length === 1 ? refs[0]! : { anyOf: refs }

  if (many) {
    return {
      type: maybeNull ? ['array', 'null'] : 'array',
      items: refOrAnyOfRefs,
    } as OpenapiSchemaBody
  }

  if (maybeNull) return { anyOf: [...refs, { type: 'null' }] }

  return refOrAnyOfRefs
}
