import { Dream } from '@rvoh/dream'
import { camelize } from '@rvoh/dream/utils'

export class SerializingPlainPropertyWithoutOpenapiShape extends Error {
  constructor(
    private dreamClass: typeof Dream,
    private field: string,
  ) {
    super()
  }

  public override get message() {
    return `
A DreamSerializer attribute is being used to render
${this.dreamClass.sanitizedName}.${this.field}, but that is not a database field,
so the OpenAPI shape cannot be automatically determined.

Either:

A) Include the OpenAPI shape in the serializer attribute:
\`\`\`
export const ${this.dreamClass.sanitizedName}Serializer = (${camelize(this.dreamClass.sanitizedName)}: ${this.dreamClass.sanitizedName}) =>
  DreamSerializer(${this.dreamClass.sanitizedName}, ${camelize(this.dreamClass.sanitizedName)})
    ...
    .attribute('${this.field}', { openapi: 'string' })
\`\`\`

Or:

B) Specify the OpenAPI shape in a \`Virtual\` decorator, e.g.:
\`\`\`
export default class ${this.dreamClass.sanitizedName} extends ApplicationModel {
  ...

  // as a simple property:
  @deco.Virtual('string') // shorthand string or a Psychic OpenAPI object
  public ${this.field}: string

  // as getter and setter:
  @deco.Virtual('string') // shorthand string or a Psychic OpenAPI object
  public get ${this.field}(): string {
  ...
  }
  public set ${this.field}(val: string) {
  ...
  }
\`\`\`
`
  }
}
