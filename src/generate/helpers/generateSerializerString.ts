import * as pluralize from 'pluralize'
import pascalize from '../../helpers/pascalize'
import PsychicDir from '../../helpers/psychicdir'
import { Dream } from 'dream'

export default async function generateSerializerString(
  serializerClassName: string,
  attributes: string[] = []
) {
  const models = await PsychicDir.loadModels()
  const relatedModelName = pluralize.singular(pascalize(serializerClassName))
  const ModelClass = Object.values(models).find(
    ModelClass => (ModelClass as typeof Dream).name === relatedModelName
  ) as typeof Dream | null

  const attrs = [...((ModelClass as typeof Dream)?.columns() || []), ...attributes] as string[]

  if (!attrs.length)
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
        ${attrs.map(attr => `'${attr}'`).join(',\n        ')}
      )
  }
}\
`
}
