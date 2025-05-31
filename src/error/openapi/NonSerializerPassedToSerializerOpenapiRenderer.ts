import { inspect } from 'node:util'

export default class NonSerializerPassedToSerializerOpenapiRenderer extends Error {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private serializer: any) {
    super()
  }

  public override get message() {
    return `
Non-serializer passed to SerializerOpenapiRenderer:
${inspect(this.serializer)}`
  }
}
