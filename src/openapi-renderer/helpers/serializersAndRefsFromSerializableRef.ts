import { DreamApp } from '@rvoh/dream'
import {
  OpenapiSchemaExpressionRef,
  OpenapiSchemaShorthandExpressionSerializableRef,
} from '@rvoh/dream/openapi'
import { DreamModelSerializerType, SerializerCasing, SimpleObjectSerializerType } from '@rvoh/dream/types'
import { sortBy, uniq } from '@rvoh/dream/utils'
import SerializerOpenapiRenderer from '../SerializerOpenapiRenderer.js'

export default function serializersAndRefsFromSerializableRef(
  serializableRef: OpenapiSchemaShorthandExpressionSerializableRef,
  {
    casing = 'camel',
    suppressResponseEnums = false,
  }: {
    casing?: SerializerCasing
    suppressResponseEnums?: boolean
  } = {},
): {
  serializers: (DreamModelSerializerType | SimpleObjectSerializerType)[]
  refs: OpenapiSchemaExpressionRef[]
} {
  const key = serializableRef.$serializableSerializerKey || serializableRef.key || 'default'
  const serializerRefs = sortBy(
    uniq(
      DreamApp.system.inferSerializersFromDreamClassOrViewModelClass(serializableRef.$serializable, key),
    ).map(serializer => ({
      serializer,
      ref: new SerializerOpenapiRenderer(serializer, {
        casing,
        suppressResponseEnums,
      }).serializerRef,
    })),
    ({ ref }) => ref.$ref,
  )

  return {
    serializers: serializerRefs.map(({ serializer }) => serializer),
    refs: serializerRefs.map(({ ref }) => ref),
  }
}
