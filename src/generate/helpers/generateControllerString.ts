import * as pluralize from 'pluralize'
import pascalize from '../../../src/helpers/pascalize'
import camelize from '../../../src/helpers/camelize'
import PsychicDir from '../../../src/helpers/psychicdir'
import capitalize from '../../../src/helpers/capitalize'
import { Dream } from 'dream'
import getModelKey from '../../config/helpers/getModelKey'

export default async function generateControllerString(
  route: string,
  modelName: string | null,
  methods: string[] = []
) {
  const crudMethods = ['create', 'index', 'show', 'update', 'destroy']
  const psyImports: string[] = ['PsychicController', 'Params']
  const additionalImports: string[] = []
  let hasCrudMethod = false

  let modelClass: typeof Dream | null = null

  if (modelName) {
    const models = await PsychicDir.loadModels()
    const modelKey = Object.keys(models).find(modelKey => {
      const userProvided = pluralize.singular(
        modelName
          .split('/')
          .map(str => pascalize(str))
          .join('/')
      )

      return modelKey === userProvided
    }) as string | null
    if (modelKey) modelClass = models[modelKey] as typeof Dream | null
  }

  if (modelClass)
    additionalImports.push(
      `\
import ${modelClass.name} from '${routeDepthToRelativePath(route)}/models/${await getModelKey(
        modelClass as typeof Dream
      )}'`
    )

  const methodDefs = methods.map(methodName => {
    if (crudMethods.includes(methodName)) hasCrudMethod = true

    switch (methodName) {
      case 'create':
        if (modelClass)
          return `\
  public async create() {
    const ${camelize(modelClass.name)} = await ${modelClass.name}.create(this.${camelize(
            modelClass.name
          )}Params)
    this.ok(${camelize(modelClass.name)})
  }`
        else
          return `\
  public async create() {
  }`

      case 'index':
        if (modelClass)
          return `\
  public async index() {
    const ${pluralize(camelize(modelClass.name))} = await ${modelClass.name}.all()
    this.ok(${pluralize(camelize(modelClass.name))})
  }`
        else
          return `\
  public async index() {
  }`

      case 'show':
        if (modelClass)
          return `\
  public async show() {
    const ${camelize(modelClass.name)} = await ${modelClass.name}.find(this.params.id)
    this.ok(${camelize(modelClass.name)})
  }`
        else
          return `\
  public async show() {
  }`

      case 'update':
        if (modelClass)
          return `\
  public async update() {
    const ${camelize(modelClass.name)} = await ${modelClass.name}.find(this.params.id)
    await ${camelize(modelClass.name)}.update(this.${camelize(modelClass.name)}Params)
    this.ok(${camelize(modelClass.name)})
  }`
        else
          return `\
  public async update() {
  }`

      case 'destroy':
        if (modelClass)
          return `\
  public async destroy() {
    const ${camelize(modelClass.name)} = await ${modelClass.name}.find(this.params.id)
    await ${camelize(modelClass.name)}.destroy()
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
  if (modelName && modelClass && hasCrudMethod) {
    const singularName = pluralize.singular(camelize(modelName))
    privateDefs.push(
      `\
  private get ${singularName}Params() {
    return Params.restrict(this.params?.${singularName}, [${(modelClass.columns() as string[])
        .map(attr => `'${attr}'`)
        .join(', ')}])
  }`
    )
  }

  const pascalizedRoute = route
    .split('/')
    .map(n => capitalize(n))
    .join('')
  return `\
import { ${psyImports.join(', ')} } from 'psychic'${
    !!additionalImports.length ? '\n' + additionalImports.join('\n') : ''
  }

export default class ${pascalize(pluralize(pascalizedRoute))}Controller extends PsychicController {
${methodDefs.join('\n\n')}${privateDefs.length ? '\n\n' + privateDefs.join('\n\n') : ''}
}\
`
}

function routeDepthToRelativePath(route: string) {
  const depth = route.split('/').length
  return Array(depth).fill('..').join('/')
}
