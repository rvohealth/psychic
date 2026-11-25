import { Dream } from '@rvoh/dream'

/**
 * Thrown while rendering OpenAPI (so at boot, and by sync) when a serializer
 * `attribute` or `delegatedAttribute` passes an `openapi` shape for a column
 * whose shape the model declares with `@deco.JSON`. Not exported: an
 * application fixes the declaration rather than catching this.
 */
export default class SerializerOpenapiShapeOnJSONColumn extends Error {
  constructor(
    private source: string,
    private dreamClass: typeof Dream,
    private column: string,
  ) {
    super()
  }

  public override get message() {
    const modelName = this.dreamClass.sanitizedName
    return `
${this.source} passes an OpenAPI shape for ${modelName}#${this.column},
but ${modelName} declares that column's shape with @deco.JSON.

The @deco.JSON declaration is the column's single shape, read by every
serializer, request body and Params.for, so a serializer attribute or
delegatedAttribute on that column takes only a description.

Remove the shape from the attribute's \`openapi\` option (keep
\`{ description: '...' }\` if you want one), or change the @deco.JSON
declaration on ${modelName}.`
  }
}
