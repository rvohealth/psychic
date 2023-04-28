import * as pluralize from 'pluralize'
import pascalize from '../../helpers/pascalize'
import PsychicDir from '../../helpers/psychicdir'
import { Dream } from 'dream'

export default async function generateSerializerString(controllerName: string, attributes: string[] = []) {
  const models = await PsychicDir.loadModels()
  const relatedModelName = pluralize.singular(pascalize(controllerName))
  const ModelClass = Object.values(models).find(
    ModelClass => (ModelClass as typeof Dream).name === relatedModelName
  ) as typeof Dream | null

  const attrs = [...((ModelClass as typeof Dream)?.columns() || []), ...attributes]

  if (!attrs.length)
    return `\
import { PsychicSerializer } from 'psychic'

export default class ${pascalize(pluralize.singular(controllerName))}Serializer extends PsychicSerializer {
  static {
  }
}`

  return `\
import { PsychicSerializer } from 'psychic'

export default class ${pascalize(pluralize.singular(controllerName))}Serializer extends PsychicSerializer {
  static {
    this
      .attributes(
        ${attrs.map(attr => `'${attr}'`).join(',\n        ')}
      )
  }
}\
`
}
