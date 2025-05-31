import { InternalAnyTypedSerializerRendersMany, InternalAnyTypedSerializerRendersOne } from '@rvoh/dream'

export default class ExpectedSerializerForRendersOneOrManyOption extends Error {
  constructor(
    private rendersOneOrMany: 'rendersOne' | 'rendersMany',
    private referencingSerializerName: string,
    private attribute: // eslint-disable-next-line @typescript-eslint/no-explicit-any
    | InternalAnyTypedSerializerRendersOne<any, string>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      | InternalAnyTypedSerializerRendersMany<any, string>,
  ) {
    super()
  }

  public override get message() {
    const baseString = `
The \`serializer\` option on the \`${this.attribute.name}\` \`${this.rendersOneOrMany}\`
on serializer \`${this.referencingSerializerName}\``

    if (this.attribute.options?.serializer) {
      return `${baseString}
specifies something other than a serializer.
It should look something like the following:

\`\`\`
.${this.rendersOneOrMany}('${this.attribute.name}', {
  serializer: MySerializer
})
\`\`\`
`
    } else {
      return `${baseString}
is throwing an error.
`
    }
  }
}
