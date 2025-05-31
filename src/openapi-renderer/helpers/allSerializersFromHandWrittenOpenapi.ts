import {
  DreamModelSerializerType,
  OpenapiSchemaBodyShorthand,
  OpenapiShorthandPrimitiveTypes,
  SimpleObjectSerializerType,
} from '@rvoh/dream'
import isObject from '../../helpers/isObject.js'

export default function allSerializersFromHandWrittenOpenapi(
  openapi: OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes | undefined,
): (DreamModelSerializerType | SimpleObjectSerializerType)[] {
  const serializers = new Set<DreamModelSerializerType | SimpleObjectSerializerType>()

  extractSerializers(openapi, serializers)

  return [...serializers]
}

function extractSerializers(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any,
  serializers: Set<DreamModelSerializerType | SimpleObjectSerializerType>,
) {
  if (!value) return

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if (value.$serializer) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
    serializers.add(value.$serializer)
    //
  } else if (isObject(value)) {
    // Recurse into objects
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    Object.values(value).forEach(val => extractSerializers(val, serializers))
    //
  } else if (Array.isArray(value)) {
    // Recurse into arrays
    value.forEach(val => extractSerializers(val, serializers))
  }
}
