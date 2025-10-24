import { Dream } from '@rvoh/dream'
import { inferSerializerFromDreamOrViewModel, isDreamSerializer } from '@rvoh/dream/internal'
import { SerializerRendererOpts, ViewModel } from '@rvoh/dream/types'

export default function renderDreamOrVewModel(
  data: Dream | ViewModel,
  serializerKey: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  passthrough: any,
  renderOpts: SerializerRendererOpts,
) {
  const serializer = inferSerializerFromDreamOrViewModel(data, serializerKey)

  if (serializer && isDreamSerializer(serializer)) {
    // passthrough data going into the serializer is the argument that gets
    // used in the custom attribute callback function
    return serializer(data, passthrough).render(
      // passthrough data must be passed both into the serializer and render
      // because, if the serializer does accept passthrough data, then passing it in is how
      // it gets into the serializer, but if it does not accept passthrough data, and therefore
      // does not pass it into the call to DreamSerializer/ObjectSerializer,
      // then it would be lost to serializers rendered via rendersOne/Many, and SerializerRenderer
      // handles passing its passthrough data into those
      passthrough,
      renderOpts,
    )
  }

  throw new Error(`${serializer?.constructor?.name} is not a Dream serializer`)
}
