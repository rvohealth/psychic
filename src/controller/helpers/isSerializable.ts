import { Dream, inferSerializersFromDreamClassOrViewModelClass, isDreamSerializer } from '@rvoh/dream'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function isSerializable(serializableOrSerializerClass: any): boolean {
  return (
    isDreamSerializer(serializableOrSerializerClass) ||
    Array.isArray(serializableOrSerializerClass) ||
    inferSerializersFromDreamClassOrViewModelClass(serializableOrSerializerClass as typeof Dream).length > 0
  )
}
