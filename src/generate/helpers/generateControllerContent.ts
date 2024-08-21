import { camelize } from '@rvohealth/dream'
import globalClassNameFromFullyQualifiedModelName from '@rvohealth/dream/src/helpers/globalClassNameFromFullyQualifiedModelName'
import standardizeFullyQualifiedModelName from '@rvohealth/dream/src/helpers/standardizeFullyQualifiedModelName'
import pluralize from 'pluralize'
import relativePsychicPath from '../../helpers/path/relativePsychicPath'
// import globalClassNameFromFullyQualifiedModelName from '../globalClassNameFromFullyQualifiedModelName'
// import relativeDreamPath from '../path/relativeDreamPath'
// import serializerNameFromFullyQualifiedModelName from '../serializerNameFromFullyQualifiedModelName'
// import snakeify from '../snakeify'
// import standardizeFullyQualifiedModelName from '../standardizeFullyQualifiedModelName'
// import uniq from '../uniq'

export default function generateControllerContent(
  fullyQualifiedControllerName: string,
  route: string,
  fullyQualifiedModelName: string | null,
  methods: string[] = [],
) {
  fullyQualifiedControllerName = standardizeFullyQualifiedModelName(fullyQualifiedControllerName)

  const additionalImports: string[] = []
  const controllerClassName = globalClassNameFromFullyQualifiedModelName(fullyQualifiedControllerName)

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

  let modelClassName: string | undefined
  let modelAttributeName: string | undefined
  if (fullyQualifiedModelName) {
    fullyQualifiedModelName = standardizeFullyQualifiedModelName(fullyQualifiedModelName)
    modelClassName = globalClassNameFromFullyQualifiedModelName(fullyQualifiedModelName)
    modelAttributeName = camelize(modelClassName)
    additionalImports.push(importStatementForModel(fullyQualifiedControllerName, fullyQualifiedModelName))
  }

  const methodDefs = methods.map(methodName => {
    switch (methodName) {
      case 'create':
        if (modelAttributeName)
          return `\
  @OpenAPI(${modelClassName}, { status: 201 })
  public async create() {
    //    const ${modelAttributeName} = await this.currentUser.createAssociation('${pluralize(modelAttributeName)}', this.paramsFor(${modelClassName}))
    //    this.created(${modelAttributeName})
  }`
        else
          return `\
  public async create() {
  }`

      case 'index':
        if (modelAttributeName)
          return `\
  @OpenAPI(${modelClassName}, {
    status: 200,
    many: true,
    serializerKey: 'summary',
  })
  public async index() {
    //    const ${pluralize(modelAttributeName)} = await this.currentUser.associationQuery('${pluralize(modelAttributeName)}').all()
    //    this.ok(${pluralize(modelAttributeName)})
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
        if (modelAttributeName)
          return `\
  @OpenAPI(${modelClassName}, { status: 200 })
  public async show() {
    //    const ${modelAttributeName} = await this.${modelAttributeName}()
    //    this.ok(${modelAttributeName})
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
        if (modelAttributeName)
          return `\
  @OpenAPI(${modelClassName}, { status: 204 })
  public async update() {
    //    const ${modelAttributeName} = await this.${modelAttributeName}()
    //    await ${modelAttributeName}.update(this.paramsFor(${modelClassName}))
    //    this.noContent()
  }`
        else
          return `\
  @OpenAPI({ status: 204 })
  public async update() {
  }`

      case 'destroy':
        if (modelAttributeName)
          return `\
  @OpenAPI({ status: 204 })
  public async destroy() {
    //    const ${modelAttributeName} = await this.${modelAttributeName}()
    //    await ${modelAttributeName}.destroy()
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

export default class ${controllerClassName} extends ${extendingClassName} {
${methodDefs.join('\n\n')}${modelClassName ? privateMethods(modelClassName, methods) : ''}
}\
`
}

function privateMethods(modelClassName: string, methods: string[]) {
  const privateMethods: string[] = []
  if (methods.find(methodName => ['show', 'update', 'destroy'].includes(methodName)))
    privateMethods.push(loadModelStatement(modelClassName))

  if (!privateMethods.length) return ''
  return `\n${privateMethods.join('\n')}`
}

function loadModelStatement(modelClassName: string) {
  return `
  private async ${camelize(modelClassName)}() {
    return await this.currentUser.associationQuery('${pluralize(camelize(modelClassName))}').findOrFail(
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

function importStatementForModel(originControllerName: string, destinationModelName: string) {
  console.debug({ originControllerName, destinationModelName })
  return `import ${globalClassNameFromFullyQualifiedModelName(destinationModelName)} from '${relativePsychicPath('controllers', 'models', originControllerName, destinationModelName)}'`
}
