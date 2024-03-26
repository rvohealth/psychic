import pluralize from 'pluralize'
import { camelize, capitalize } from '@rvohealth/dream'

export default async function generateControllerString(
  controllerClassName: string,
  route: string,
  fullyQualifiedModelName: string | null,
  methods: string[] = [],
  attributes: string[] | null = []
) {
  const crudMethods = ['create', 'index', 'show', 'update', 'destroy']
  const psyImports: string[] = ['Params']
  const additionalImports: string[] = []
  let hasCrudMethod = false

  let modelName: string | undefined
  const controllerClassNameWithoutSlashes = controllerClassName.replace(/\//g, '')

  let extendingClassName = 'AuthedController'
  if (/^\/{0,1}admin\/.*/.test(route)) {
    additionalImports.push(
      `import AdminAuthedController from '${routeDepthToRelativePath(route, 1)}/Admin/AuthedController'`
    )
    extendingClassName = 'AdminAuthedController'
  } else {
    additionalImports.push(
      `import AuthedController from '${routeDepthToRelativePath(route, 1)}/AuthedController'`
    )
  }

  if (fullyQualifiedModelName) {
    modelName = fullyQualifiedModelName.split('/').pop()
    additionalImports.push(
      `\
import ${modelName} from '${routeDepthToRelativePath(route)}/models/${fullyQualifiedModelName}'`
    )
  }

  const methodDefs = methods.map(methodName => {
    if (crudMethods.includes(methodName)) hasCrudMethod = true

    switch (methodName) {
      case 'create':
        if (modelName)
          return `\
  public async create() {
    //    const ${camelize(modelName)} = await ${modelName}.create(this.${camelize(modelName)}Params)
    //    this.ok(${camelize(modelName)})
  }`
        else
          return `\
  public async create() {
  }`

      case 'index':
        if (modelName)
          return `\
  public async index() {
    //    const ${pluralize(camelize(modelName))} = await ${modelName}.all()
    //    this.ok(${pluralize(camelize(modelName))})
  }`
        else
          return `\
  public async index() {
  }`

      case 'show':
        if (modelName)
          return `\
  public async show() {
    //    const ${camelize(modelName)} = await ${modelName}.find(this.params.id)
    //    this.ok(${camelize(modelName)})
  }`
        else
          return `\
  public async show() {
  }`

      case 'update':
        if (modelName)
          return `\
  public async update() {
    //    const ${camelize(modelName)} = await ${modelName}.find(this.params.id)
    //    await ${camelize(modelName)}.update(this.${camelize(modelName)}Params)
    //    this.ok(${camelize(modelName)})
  }`
        else
          return `\
  public async update() {
  }`

      case 'destroy':
        if (modelName)
          return `\
  public async destroy() {
    //    const ${camelize(modelName)} = await ${modelName}.find(this.params.id)
    //    await ${camelize(modelName)}.destroy()
    //    this.ok()
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
  if (modelName && hasCrudMethod) {
    attributes ||= []
    const singularName = pluralize.singular(camelize(modelName))
    privateDefs.push(
      `\
  private get ${singularName}Params() {
    return Params.restrict(this.params, [${attributes.map(attr => `'${camelize(attr)}'`).join(', ')}])
  }`
    )
  }

  const pascalizedRoute = route
    .split('/')
    .map(n => capitalize(n))
    .join('')
  return `\
import { ${psyImports.join(', ')} } from '@rvohealth/psychic'${
    !!additionalImports.length ? '\n' + additionalImports.join('\n') : ''
  }

export default class ${controllerClassNameWithoutSlashes} extends ${extendingClassName} {
${methodDefs.join('\n\n')}${privateDefs.length ? '\n\n' + privateDefs.join('\n\n') : ''}
}\
`
}

function routeDepthToRelativePath(route: string, subtractFromDepth: number = 0) {
  const depth = route.replace(/^\//, '').split('/').length
  return (
    Array(depth - subtractFromDepth)
      .fill('..')
      .join('/') || '.'
  )
}
