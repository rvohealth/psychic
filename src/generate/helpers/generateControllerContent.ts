import pluralize from 'pluralize'
import { camelize } from '@rvohealth/dream'
import pascalizeFileName from '../../helpers/pascalizeFileName'

export default function generateControllerContent(
  controllerClassName: string,
  route: string,
  fullyQualifiedModelName: string | null,
  methods: string[] = [],
) {
  const additionalImports: string[] = []

  let modelName: string | undefined
  const controllerClassNameWithoutSlashes = controllerClassName.replace(/\//g, '')

  let extendingClassName = 'AuthedController'
  if (/^\/{0,1}admin\/.*/.test(route)) {
    additionalImports.push(
      `import AdminAuthedController from '${routeDepthToRelativePath(route, 1)}/Admin/AuthedController'`,
    )
    extendingClassName = 'AdminAuthedController'
  } else {
    additionalImports.push(
      `import AuthedController from '${routeDepthToRelativePath(route, 1)}/AuthedController'`,
    )
  }

  if (fullyQualifiedModelName) {
    modelName = pascalizeFileName(fullyQualifiedModelName)
    additionalImports.push(
      `\
import ${modelName} from '${routeDepthToRelativePath(route)}/models/${fullyQualifiedModelName}'`,
    )
  }

  const methodDefs = methods.map(methodName => {
    switch (methodName) {
      case 'create':
        if (modelName)
          return `\
  public async create() {
    //    const ${camelize(modelName)} = await this.currentUser.createAssociation('${pluralize(camelize(modelName))}', this.paramsFor(${modelName}))
    //    this.created(${camelize(modelName)})
  }`
        else
          return `\
  public async create() {
  }`

      case 'index':
        if (modelName)
          return `\
  public async index() {
    //    const ${pluralize(camelize(modelName))} = await this.currentUser.associationQuery('${pluralize(camelize(modelName))}').all()
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
    //    const ${camelize(modelName)} = await this.currentUser.associationQuery('${pluralize(camelize(modelName))}').find(this.castParam('id', 'string'))
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
    //    const ${camelize(modelName)} = await this.currentUser.associationQuery('${pluralize(camelize(modelName))}').find(this.castParam('id', 'string'))
    //    await ${camelize(modelName)}.update(this.paramsFor(${modelName}))
    //    this.noContent()
  }`
        else
          return `\
  public async update() {
  }`

      case 'destroy':
        if (modelName)
          return `\
  public async destroy() {
    //    const ${camelize(modelName)} = await this.currentUser.associationQuery('${pluralize(camelize(modelName))}').find(this.castParam('id', 'string'))
    //    await ${camelize(modelName)}.destroy()
    //    this.noContent()
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

  return `\
${additionalImports.length ? additionalImports.join('\n') : ''}

export default class ${controllerClassNameWithoutSlashes} extends ${extendingClassName} {
${methodDefs.join('\n\n')}
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
