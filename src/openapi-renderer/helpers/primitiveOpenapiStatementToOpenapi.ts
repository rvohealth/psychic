import {
  OpenapiNumberFormats,
  OpenapiSchemaBody,
  SerializableTypes,
  openapiPrimitiveTypes,
  openapiShorthandPrimitiveTypes,
} from '@rvoh/dream'

/**
 * @internal
 *
 * parses a primitive stored type
 */
export default function primitiveOpenapiStatementToOpenapi(
  data: SerializableTypes | undefined,
  maybeNull: boolean = false,
): OpenapiSchemaBody {
  if (!data) return { type: ['object', 'null'] }

  const primitiveString = maybeNullPrimitiveToPrimitive(data as MaybeNullPrimitive)
  maybeNull = maybeNull || booleanNullFromMaybeNullPrimitive(data as MaybeNullPrimitive)

  switch (primitiveString) {
    case 'string':
    case 'number':
    case 'boolean':
    case 'integer':
      return {
        type: maybeNull ? [primitiveString, 'null'] : primitiveString,
      }

    case 'decimal':
    case 'double':
      return {
        type: maybeNull ? ['number', 'null'] : 'number',
        format: primitiveString,
      }

    case 'date':
    case 'date-time':
      return {
        type: maybeNull ? ['string', 'null'] : 'string',
        format: primitiveString,
      }

    case 'string[]':
    case 'number[]':
    case 'boolean[]':
    case 'integer[]':
      return {
        type: maybeNull ? ['array', 'null'] : 'array',
        items: {
          type: primitiveTypeToOpenapiType(primitiveString),
        },
      }

    case 'decimal[]':
    case 'double[]':
      return {
        type: maybeNull ? ['array', 'null'] : 'array',
        items: {
          type: 'number',
          format: stripBracketsFromPrimitiveString(primitiveString) as OpenapiNumberFormats,
        },
      }

    case 'date[]':
    case 'date-time[]':
      return {
        type: maybeNull ? ['array', 'null'] : 'array',
        items: {
          type: 'string',
          format: stripBracketsFromPrimitiveString(primitiveString),
        },
      }

    case 'null':
      return {
        type: 'null',
      }

    default:
      throw new Error(`Unrecognized primitive type ${primitiveString}`)
  }
}

export function maybeNullPrimitiveToPrimitive(openapiType: MaybeNullPrimitive): PrimitiveWithArrayString {
  if (Array.isArray(openapiType)) {
    if (openapiType[1] === 'null') return openapiType[0]
    if (openapiType[0] === 'null') return openapiType[1]
    throw new Error(
      `Expected array with 'null' and an OpenAPI primitive string: ${JSON.stringify(openapiType)}`,
    )
  } else {
    return openapiType
  }
}

export function booleanNullFromMaybeNullPrimitive(openapiType: MaybeNullPrimitive): boolean {
  if (Array.isArray(openapiType)) {
    if (openapiType[1] === 'null') return true
    if (openapiType[0] === 'null') return true
    throw new Error(
      `Expected array with 'null' and an OpenAPI primitive string: ${JSON.stringify(openapiType)}`,
    )
  } else {
    return false
  }
}

/**
 * @internal
 *
 * removes array brackets from primitive openapi type before putting in
 * openapi type fields
 */
function primitiveTypeToOpenapiType(type: PrimitiveWithArrayString): NonArrayPrimitiveString {
  switch (type) {
    case 'date':
    case 'date-time':
    case 'date[]':
    case 'date-time[]':
      return 'string'

    default:
      return stripBracketsFromPrimitiveString(type)
  }
}

/**
 * @internal
 *
 * removes array brackets from primitive openapi format types before putting in
 * openapi type fields
 */
function stripBracketsFromPrimitiveString(type: PrimitiveWithArrayString): NonArrayPrimitiveString {
  return type.replace(/\[\]$/, '') as NonArrayPrimitiveString
}

export type MaybeNullPrimitive =
  | PrimitiveWithArrayString
  | [PrimitiveWithArrayString, 'null']
  | ['null', PrimitiveWithArrayString]

type PrimitiveOrObjectOrArray = PrimitiveWithArrayString | 'object' | 'array'

export type MaybeNullPrimitiveOrObjectOrArray =
  | PrimitiveOrObjectOrArray
  | [PrimitiveOrObjectOrArray, 'null']
  | ['null', PrimitiveOrObjectOrArray]

export type NonArrayPrimitiveString = (typeof openapiPrimitiveTypes)[number]
export type PrimitiveWithArrayString = (typeof openapiShorthandPrimitiveTypes)[number]
