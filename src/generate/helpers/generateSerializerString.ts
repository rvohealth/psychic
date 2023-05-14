export default async function generateSerializerString(
  serializerClassName: string,
  fullyQualifiedModelName: string,
  attributes: string[] = []
) {
  if (!attributes.length)
    return `\
import { PsychicSerializer } from 'psychic'

export default class ${serializerClassName} extends PsychicSerializer {
}`
  const luxonImport = hasDateTimeType(attributes) ? "import { DateTime } from 'luxon'\n" : ''
  return `\
${luxonImport}import { PsychicSerializer, Attribute } from 'psychic'

export default class ${serializerClassName} extends PsychicSerializer {
  ${attributes
    .map(attr => {
      const [name, type] = attr.split(':')
      return `@Attribute(${attributeSpecifier(type)})
  public ${name}: ${jsType(type)}`
    })
    .join(',\n  ')}
}\
`
}

function attributeSpecifier(type: string) {
  switch (type) {
    case 'date':
      return "'date'"
    default:
      return ''
  }
}

function jsType(type?: string) {
  switch (type) {
    case 'datetime':
    case 'date':
      return 'DateTime'
    case 'decimal':
    case 'integer':
    case 'number':
      return 'number'

    case 'string':
    case 'text':
      return 'string'

    default:
      return 'any'
  }
}

function hasDateTimeType(attributes: string[]) {
  return !!attributes.map(attr => jsType(attr.split(':')[1])).find(a => a === 'DateTime')
}
