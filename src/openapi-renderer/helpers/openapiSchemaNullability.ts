import { OpenapiSchemaBody, OpenapiSchemaBodyShorthand } from '@rvoh/dream/openapi'

const NULL_OBJECT_OPENAPI: OpenapiSchemaBody = { type: 'null' }

// root keywords that apply a subschema to the value itself; any of them can
// still reject null after the schema's own `type` admits it
const SUBSCHEMA_APPLICATORS = ['allOf', 'anyOf', 'oneOf', 'not', 'if', '$ref'] as const

function hasSubschemaApplicator(schemaRecord: Record<string, unknown>): boolean {
  return SUBSCHEMA_APPLICATORS.some(keyword => schemaRecord[keyword] !== undefined)
}

function openapiTypeIncludesNull(type: unknown): boolean {
  return type === 'null' || (Array.isArray(type) && type.includes('null'))
}

/**
 * @internal
 *
 * Whether the schema is known to accept null: its `type`, `enum` and `const`
 * all admit null and no subschema applied beside them can reject it, or, with
 * no `type`, a root `anyOf` has a branch that accepts null. A schema this cannot
 * prove accepts null (a `$ref`, for one) answers false.
 */
export function openapiSchemaAcceptsNull(schema: OpenapiSchemaBodyShorthand): boolean {
  if (typeof schema !== 'object' || schema === null) return false

  const schemaRecord = schema as Record<string, unknown>

  if (Array.isArray(schemaRecord.enum) && !schemaRecord.enum.includes(null)) return false
  if ('const' in schemaRecord && schemaRecord.const !== null) return false

  if (schemaRecord.type !== undefined)
    return openapiTypeIncludesNull(schemaRecord.type) && !hasSubschemaApplicator(schemaRecord)

  return (
    Array.isArray(schemaRecord.anyOf) &&
    schemaRecord.anyOf.some(member => openapiSchemaAcceptsNull(member as OpenapiSchemaBodyShorthand)) &&
    !hasSubschemaApplicator({ ...schemaRecord, anyOf: undefined })
  )
}

/**
 * @internal
 *
 * Widens a schema to also accept null. When its `type`, `enum` and `const` are
 * the only keywords that can reject null, null is added to each in place
 * (a `const` becomes an `enum` of its value and null), matching how a nullable
 * enum column renders. Otherwise (no `type`, a subschema applied beside it, or
 * both an `enum` and a `const`) the result is `anyOf` the schema or null.
 */
export function openapiSchemaWithNull(schema: OpenapiSchemaBodyShorthand): OpenapiSchemaBodyShorthand {
  const schemaRecord = schema as Record<string, unknown>
  const { type } = schemaRecord
  const hasConst = 'const' in schemaRecord

  if (
    type === undefined ||
    hasSubschemaApplicator(schemaRecord) ||
    (hasConst && schemaRecord.enum !== undefined)
  )
    return { anyOf: [schema, NULL_OBJECT_OPENAPI] }

  const { const: constValue, ...schemaWithoutConst } = schemaRecord
  const types = Array.isArray(type) ? (type as unknown[]) : [type]
  const allowedValues = hasConst ? [constValue] : schemaRecord.enum

  return {
    ...schemaWithoutConst,
    type: openapiTypeIncludesNull(type) ? type : [...types, 'null'],
    ...(Array.isArray(allowedValues)
      ? { enum: allowedValues.includes(null) ? allowedValues : [...(allowedValues as unknown[]), null] }
      : {}),
  } as OpenapiSchemaBodyShorthand
}
