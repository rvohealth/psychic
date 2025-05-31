import { inspect } from 'node:util'

export default class AttemptedToDeriveDescendentSerializersFromNonSerializer extends Error {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private serializer: any) {
    super()
  }

  public override get message() {
    return `
Attempted to derive descendant serializers from non serializer:
${inspect(this.serializer)}`
  }
}
