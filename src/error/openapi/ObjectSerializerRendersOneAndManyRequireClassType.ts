export default class ObjectSerializerRendersOneAndManyRequireClassType extends Error {
  constructor(private associationName: string) {
    super()
  }

  public override get message() {
    return `
ObjectSerializer \`rendersOne\` and \`rendersMany\`
options must include \`dreamClass\`, \`viewModelClass\`, or
\`serializer\`.

rendersOne/Many name: ${this.associationName}
`
  }
}
