import * as pluralize from 'pluralize'
import pascalize from '../../helpers/pascalize'
import PsychicDir from '../../helpers/psychicdir'
import { DreamModel } from 'dream'

export default async function generateSerializerString(controllerName: string, attributes: string[] = []) {
  const models = await PsychicDir.loadModels()
  console.log('DEBUG MODELS', models)
  const relatedModelName = pluralize.singular(pascalize(controllerName))
  const ModelClass = Object.values(models).find(
    ModelClass => (ModelClass as DreamModel<any, any>).name === relatedModelName
  ) as DreamModel<any, any> | null

  const attrs = [...((ModelClass as DreamModel<any, any>)?.columns || []), ...attributes]

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
