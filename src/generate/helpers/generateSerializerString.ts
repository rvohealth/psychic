export default async function generateSerializerString(
  serializerClassName: string,
  fullyQualifiedModelName: string,
  attributes: string[] = []
) {
  if (!attributes.length)
    return `\
import { PsychicSerializer } from 'psychic'

export default class ${serializerClassName} extends PsychicSerializer {
  static {
  }
}`

  return `\
import { PsychicSerializer } from 'psychic'

export default class ${serializerClassName} extends PsychicSerializer {
  static {
    this
      .attributes(
        ${attributes.map(attr => `'${attr}'`).join(',\n        ')}
      )
  }
}\
`
}
