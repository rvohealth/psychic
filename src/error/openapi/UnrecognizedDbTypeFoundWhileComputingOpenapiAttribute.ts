export default class UnrecognizedDbTypeFoundWhileComputingOpenapiAttribute extends Error {
  constructor(
    private source: string,
    private attributeName: string,
    private dbType: string,
  ) {
    super()
  }

  public override get message() {
    return `
While trying to compute the openapi shape for either a serializer or a controller's
request body, we ran into a db type that we didn't know how to automatically infer the
openapi shape for. In these cases, we recommend that you provide an explicit openapi
shape for these attributes, so that the openapi shape can be properly generated.

source:               ${this.source}
attribute:            ${this.attributeName}
unexpected db type:   ${this.dbType}

If the culprit is a serializer attribute, you should provide an explicit openapi definition
to the attribute causing your problems, like so:

  .attribute('${this.attributeName}', { openapi: { type: 'string' }})

If, instead, it is a controller's request body causing your problems, identify the controller
method responsible for this exception, and ensure that the openapi request body shape is explicitly
defined, so that you do not force psychic to autocompute the openapi body shape for this endpoint.

    @OpenAPI(MyModel, {
      requestBody: {
        type: 'object',
        properties: {
          ${this.attributeName}: {
            type: 'string',
          }
        }
      }
    })
  
`
  }
}
