export default class NoSerializerFoundForRendersOneAndMany extends Error {
  constructor(private associationName: string) {
    super()
  }

  public override get message() {
    return `
Attempted to render \`rendersOne\` / \`rendersMany\`
\`${this.associationName}\`, but could not locate a
serializer.`
  }
}
