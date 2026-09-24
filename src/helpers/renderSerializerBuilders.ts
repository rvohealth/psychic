import { DreamSerializerBuilder, ObjectSerializerBuilder } from '@rvoh/dream/system'
import { SerializerRendererOpts } from '@rvoh/dream/types'

/**
 * @internal
 *
 * Renders a serializer builder, or each serializer builder in an array, so the
 * builder itself (including every field of its underlying data) is never sent
 * as a response body. Anything else is returned as is.
 */
export default function renderSerializerBuilders(
  data: unknown,
  passthrough: object = {},
  renderOpts: SerializerRendererOpts = {},
) {
  const renderIfBuilder = (d: unknown) => (dataIsSerializerBuilder(d) ? d.render(passthrough, renderOpts) : d)
  return Array.isArray(data) ? data.map(renderIfBuilder) : renderIfBuilder(data)
}

export function dataIsSerializerBuilder(
  data: unknown,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): data is DreamSerializerBuilder<any, any, any> | ObjectSerializerBuilder<any, any> {
  return data instanceof DreamSerializerBuilder || data instanceof ObjectSerializerBuilder
}
