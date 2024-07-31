import { DreamSerializer } from '@rvohealth/dream'
import addSchemaDelimeterToSerializerKey from './addSchemaDelimiterToSerializerKey'

/**
 * @internal
 *
 * identifies the serializer key belonging to a given serializer, and
 * modifies the key to respect the `schemaDelimeter` config option,
 * separating all path-related nodes with the provided delimeter.
 *
 * If the serializer cannot be located, an exception is raised.
 */
export default function computedSerializerKeyOrFail(
  serializerClass: typeof DreamSerializer,
  serializers: { [key: string]: typeof DreamSerializer },
  schemaDelimeter: string,
) {
  const serializerKey = Object.keys(serializers).find(key => serializers[key] === serializerClass)
  if (!serializerKey) {
    throw new Error(`
An unexpected error occurred while serializing your app.
A serializer was not able to be located:

${serializerClass.name}
`)
  }

  return addSchemaDelimeterToSerializerKey(serializerKey, serializerClass, schemaDelimeter)
}
