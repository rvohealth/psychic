import * as pluralize from 'pluralize'
import pascalize from '../../../src/helpers/pascalize'
import camelize from '../../../src/helpers/camelize'
import PsychicDir from '../../../src/helpers/psychicdir'
import capitalize from '../../../src/helpers/capitalize'
import { DreamModel } from 'dream'
import getModelKey from '../../config/helpers/getModelKey'

export default async function generateControllerString(controllerName: string, methods: string[] = []) {
  const crudMethods = ['create', 'index', 'show', 'update', 'destroy']
  const psyImports: string[] = ['PsychicController', 'Params']
  const additionalImports: string[] = []
  let hasCrudMethod = false

  const models = await PsychicDir.loadModels()
  const ModelClass = Object.values(models).find(
    ModelClass => (ModelClass as DreamModel<any, any>).name === pluralize.singular(pascalize(controllerName))
  ) as DreamModel<any, any> | null

  if (ModelClass)
    additionalImports.push(
      `\
import ${ModelClass.name} from 'app/models/${await getModelKey(ModelClass as DreamModel<any, any>)}'`
    )

  const methodDefs = methods.map(methodName => {
    if (crudMethods.includes(methodName)) hasCrudMethod = true

    switch (methodName) {
      case 'create':
        if (ModelClass)
          return `\
  public async create() {
    const ${camelize(ModelClass.name)} = await ${ModelClass.name}.create(this.${camelize(
            ModelClass.name
          )}Params)
    this.ok(${camelize(ModelClass.name)})
  }`
        else
          return `\
  public async create() {
  }`

      case 'index':
        if (ModelClass)
          return `\
  public async index() {
    const ${pluralize(camelize(ModelClass.name))} = await ${ModelClass.name}.all()
    this.ok(${pluralize(camelize(ModelClass.name))})
  }`
        else
          return `\
  public async index() {
  }`

      case 'show':
        if (ModelClass)
          return `\
  public async show() {
    const ${camelize(ModelClass.name)} = await ${ModelClass.name}.find(this.params.id)
    this.ok(${camelize(ModelClass.name)})
  }`
        else
          return `\
  public async show() {
  }`

      case 'update':
        if (ModelClass)
          return `\
  public async update() {
    const ${camelize(ModelClass.name)} = await ${ModelClass.name}.find(this.params.id)
    await ${camelize(ModelClass.name)}.update(this.${camelize(ModelClass.name)}Params)
    this.ok(${camelize(ModelClass.name)})
  }`
        else
          return `\
  public async update() {
  }`

      case 'destroy':
        if (ModelClass)
          return `\
  public async destroy() {
    const ${camelize(ModelClass.name)} = await ${ModelClass.name}.find(this.params.id)
    await ${camelize(ModelClass.name)}.destroy()
    this.ok()
  }`
        else
          return `\
  public async destroy() {
  }`

      default:
        return `\
  public async ${methodName}() {
  }`
    }
  })

  const privateDefs: string[] = []
  if (ModelClass && hasCrudMethod) {
    const singularName = pluralize.singular(camelize(controllerName))
    privateDefs.push(
      `\
  private get ${singularName}Params() {
    return Params.restrict(this.params?.${singularName}, [${ModelClass.columns
        .map(attr => `'${attr}'`)
        .join(', ')}])
  }`
    )
  }

  const pascalizedControllerName = controllerName
    .split('/')
    .map(n => capitalize(n))
    .join('')
  return `\
import { ${psyImports.join(', ')} } from 'psychic'${
    !!additionalImports.length ? '\n' + additionalImports.join('\n') : ''
  }

export default class ${pascalize(pluralize(pascalizedControllerName))}Controller extends PsychicController {
${methodDefs.join('\n\n')}${privateDefs.length ? '\n\n' + privateDefs.join('\n\n') : ''}
}\
`
}
