import { inspect } from 'node:util'

export default class NonSerializerSuppliedToSerializerBodySegment extends Error {
  constructor(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private bodySegment: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private serializer: any,
  ) {
    super()
  }

  public override get message() {
    return `
An OpenAPI fragment specified a $serializer that is not a Dream serializer:

OpenAPI: ${inspect(this.bodySegment)}
serializer: ${inspect(this.serializer)}
`
  }
}
