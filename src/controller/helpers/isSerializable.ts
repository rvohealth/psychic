import { Dream, DreamApp } from '@rvoh/dream'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function isSerializable(serializableOrSerializerClass: any): boolean {
  return (
    DreamApp.system.isDreamSerializer(serializableOrSerializerClass) ||
    Array.isArray(serializableOrSerializerClass) ||
    DreamApp.system.inferSerializersFromDreamClassOrViewModelClass(
      serializableOrSerializerClass as typeof Dream,
    ).length > 0
  )
}
