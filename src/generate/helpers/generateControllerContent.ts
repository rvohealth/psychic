import { camelize } from '@rvohealth/dream'
import pluralize from 'pluralize'
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
  @OpenAPI(() => ${modelName}, { status: 201 })
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
  @OpenAPI(() => ${modelName}, {
    status: 200,
    many: true,
    serializerKey: 'summary',
  })
  public async index() {
    //    const ${pluralize(camelize(modelName))} = await this.currentUser.associationQuery('${pluralize(camelize(modelName))}').all()
    //    this.ok(${pluralize(camelize(modelName))})
  }`
        else
          return `\
  @OpenAPI({
    response: {
      200: {
        // add openapi definition for your custom endpoint
      }
    }
  })
  public async index() {
  }`

      case 'show':
        if (modelName)
          return `\
  @OpenAPI(() => ${modelName}, { status: 200 })
  public async show() {
    //    const ${camelize(modelName)} = await this.${camelize(modelName)}()
    //    this.ok(${camelize(modelName)})
  }`
        else
          return `\
  @OpenAPI({
    response: {
      200: {
        // add openapi definition for your custom endpoint
      }
    }
  })
  public async show() {
  }`

      case 'update':
        if (modelName)
          return `\
  @OpenAPI(() => ${modelName}, { status: 204 })
  public async update() {
    //    const ${camelize(modelName)} = await this.${camelize(modelName)}()
    //    await ${camelize(modelName)}.update(this.paramsFor(${modelName}))
    //    this.noContent()
  }`
        else
          return `\
  @OpenAPI({ status: 204 })
  public async update() {
  }`

      case 'destroy':
        if (modelName)
          return `\
  @OpenAPI({ status: 204 })
  public async destroy() {
    //    const ${camelize(modelName)} = await this.${camelize(modelName)}()
    //    await ${camelize(modelName)}.destroy()
    //    this.noContent()
  }`
        else
          return `\
  @OpenAPI({ status: 204 })
  public async destroy() {
  }`

      default:
        return `\
  @OpenAPI({
    response: {
      200: {
        // add openapi definition for your custom endpoint
      }
    }
  })
  public async ${methodName}() {
  }`
    }
  })

  return `\
import { OpenAPI } from '@rvohealth/psychic'
${additionalImports.length ? additionalImports.join('\n') : ''}

export default class ${controllerClassNameWithoutSlashes} extends ${extendingClassName} {
${methodDefs.join('\n\n')}${modelName ? privateMethods(modelName, methods) : ''}
}\
`
}

function privateMethods(modelName: string, methods: string[]) {
  const privateMethods: string[] = []
  if (methods.find(methodName => ['show', 'update', 'destroy'].includes(methodName)))
    privateMethods.push(loadModelStatement(modelName))

  if (!privateMethods.length) return ''
  return `\n${privateMethods.join('\n')}`
}

function loadModelStatement(modelName: string) {
  return `
  private async ${camelize(modelName)}() {
    return await this.currentUser.associationQuery('${pluralize(camelize(modelName))}').findOrFail(
      this.castParam('id', 'string')
    )
  }`
}

function routeDepthToRelativePath(route: string, subtractFromDepth: number = 0) {
  const depth = route.replace(/^\//, '').split('/').length
  return (
    Array(depth - subtractFromDepth)
      .fill('..')
      .join('/') || '.'
  )
}
