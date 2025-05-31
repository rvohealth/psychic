import { inspect } from 'node:util'

export default class NonSerializerSerializerOverrideProvided extends Error {
  constructor(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private rendersAssociation: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private serializer: any,
  ) {
    super()
  }

  public override get message() {
    return `
Non-serializer passed to \`serializerOverride\` of a rendersOne/Many declaration:

rendersOne/Many declaration:
${inspect(this.rendersAssociation)}

non-serializer passed to serializerOverride:
${inspect(this.serializer)}`
  }
}
