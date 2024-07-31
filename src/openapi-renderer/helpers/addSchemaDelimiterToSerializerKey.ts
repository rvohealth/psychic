import { DreamSerializer, pascalize } from '@rvohealth/dream'

/**
 * @internal
 *
 * Applies the provided `schemaDelimeter` to the passed serializerKey
 */
export default function addSchemaDelimeterToSerializerKey(
  serializerKey: string,
  serializerClass: typeof DreamSerializer,
  schemaDelimeter: string,
) {
  const serializerKeyRoot = serializerKey.replace(
    new RegExp(serializerClass.name.replace(/Serializer$/, '') + '$'),
    '',
  )

  return (
    serializerKeyRoot
      .split('/')
      .map(segment => pascalize(segment))
      .join(schemaDelimeter) + serializerClass.name.replace(/Serializer$/, '')
  )
}
