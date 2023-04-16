import * as pluralize from 'pluralize'
import pascalize from '../../helpers/pascalize'
import PsychicDir from '../../helpers/psychicdir'
import { DreamModel } from 'dream'

export default async function generateSerializerString(controllerName: string, attributes: string[] = []) {
  const additionalImports: string[] = []
  let hasCrudMethod = false
  const models = await PsychicDir.loadModels()
  const ModelClass = Object.values(models).find(
    ModelClass => (ModelClass as DreamModel<any, any>).name === pluralize.singular(pascalize(controllerName))
  ) as DreamModel<any, any> | null

  const attrs = [...(ModelClass as DreamModel<any, any>).columns, ...attributes]

  if (!attrs.length)
    return `\
import { HowlSerializer } from 'howl'

export default class ${pascalize(pluralize.singular(controllerName))}Serializer extends HowlSerializer {
  static {
  }
}`

  return `\
import { HowlSerializer } from 'howl'

export default class ${pascalize(pluralize.singular(controllerName))}Serializer extends HowlSerializer {
  static {
    this
      .attributes(
        ${attrs.map(attr => `'${attr}'`).join(',\n        ')}
      )
  }
}\
`
}
