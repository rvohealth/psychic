import {
  camelize,
  globalClassNameFromFullyQualifiedModelName,
  hyphenize,
  standardizeFullyQualifiedModelName,
} from '@rvohealth/dream'
import pluralize from 'pluralize'
import relativePsychicPath from '../../helpers/path/relativePsychicPath'

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
  let pluralizedModelAttributeName: string | undefined

  if (fullyQualifiedModelName) {
    fullyQualifiedModelName = standardizeFullyQualifiedModelName(fullyQualifiedModelName)
    modelClassName = globalClassNameFromFullyQualifiedModelName(fullyQualifiedModelName)
    modelAttributeName = camelize(modelClassName)
    pluralizedModelAttributeName = pluralize(modelAttributeName)
    additionalImports.push(importStatementForModel(fullyQualifiedControllerName, fullyQualifiedModelName))
  }

  const methodDefs = methods.map(methodName => {
    switch (methodName) {
      case 'create':
        if (modelAttributeName)
          return `\
  @OpenAPI(${modelClassName}, {
    status: 201,
    tags: openApiTags,
    description: 'Create ${aOrAnDreamModelName(modelClassName!)}',
  })
  public async create() {
    //    const ${modelAttributeName} = await this.currentUser.createAssociation('${pluralizedModelAttributeName}', this.paramsFor(${modelClassName}))
    //    this.created(${modelAttributeName})
  }`
        else
          return `\
  @OpenAPI({
    response: {
      200: {
        tags: openApiTags,
        description: '<tbd>',
        // add openapi definition for your custom endpoint
      }
    }
  })
  public async create() {
  }`

      case 'index':
        if (modelAttributeName)
          return `\
  @OpenAPI(${modelClassName}, {
    status: 200,
    tags: openApiTags,
    description: 'Fetch multiple ${pluralize(modelClassName!)}',
    many: true,
    serializerKey: 'summary',
  })
  public async index() {
    //    const ${pluralizedModelAttributeName} = await this.currentUser.associationQuery('${pluralizedModelAttributeName}').all()
    //    this.ok(${pluralizedModelAttributeName})
  }`
        else
          return `\
  @OpenAPI({
    response: {
      200: {
        tags: openApiTags,
        description: '<tbd>',
        // add openapi definition for your custom endpoint
      }
    }
  })
  public async index() {
  }`

      case 'show':
        if (modelAttributeName)
          return `\
  @OpenAPI(${modelClassName}, {
    status: 200,
    tags: openApiTags,
    description: 'Fetch ${aOrAnDreamModelName(modelClassName!)}',
  })
  public async show() {
    //    const ${modelAttributeName} = await this.${modelAttributeName}()
    //    this.ok(${modelAttributeName})
  }`
        else
          return `\
  @OpenAPI({
    response: {
      200: {
        tags: openApiTags,
        description: '<tbd>',
        // add openapi definition for your custom endpoint
      }
    }
  })
  public async show() {
  }`

      case 'update':
        if (modelAttributeName)
          return `\
  @OpenAPI(${modelClassName}, {
    status: 204,
    tags: openApiTags,
    description: 'Update ${aOrAnDreamModelName(modelClassName!)}',
  })
  public async update() {
    //    const ${modelAttributeName} = await this.${modelAttributeName}()
    //    await ${modelAttributeName}.update(this.paramsFor(${modelClassName}))
    //    this.noContent()
  }`
        else
          return `\
  @OpenAPI({
    status: 204,
    tags: openApiTags,
    description: '<tbd>',
  })
  public async update() {
  }`

      case 'destroy':
        if (modelAttributeName)
          return `\
  @OpenAPI({
    status: 204,
    tags: openApiTags,
    description: 'Destroy ${aOrAnDreamModelName(modelClassName!)}',
  })
  public async destroy() {
    //    const ${modelAttributeName} = await this.${modelAttributeName}()
    //    await ${modelAttributeName}.destroy()
    //    this.noContent()
  }`
        else
          return `\
  @OpenAPI({
    status: 204,
    tags: openApiTags,
    description: '<tbd>',
  })
  public async destroy() {
  }`

      default:
        return `\
  @OpenAPI({
    response: {
      200: {
        tags: openApiTags,
        description: '<tbd>',
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

const openApiTags = ['${hyphenize(pluralizedModelAttributeName || controllerClassName.replace(/Controller$/, ''))}']

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
  return `import ${globalClassNameFromFullyQualifiedModelName(destinationModelName)} from '${relativePsychicPath('controllers', 'models', originControllerName, destinationModelName)}'`
}

function aOrAnDreamModelName(dreamName: string) {
  if (/^[aeiou]/.test(dreamName)) return `an ${dreamName}`
  return `a ${dreamName}`
}
