import { DreamApp } from '@rvoh/dream'
import { camelize, hyphenize } from '@rvoh/dream/utils'
import pluralize from 'pluralize-esm'

export default function generateControllerContent({
  ancestorName,
  ancestorImportStatement,
  fullyQualifiedControllerName,
  fullyQualifiedModelName,
  actions = [],
  omitOpenApi = false,
  owningModel,
  forAdmin,
  singular,
}: {
  ancestorName: string
  ancestorImportStatement: string
  fullyQualifiedControllerName: string
  fullyQualifiedModelName?: string | undefined
  actions?: string[] | undefined
  omitOpenApi?: boolean | undefined
  owningModel?: string | undefined
  forAdmin: boolean
  singular: boolean
}) {
  fullyQualifiedControllerName = DreamApp.system.standardizeFullyQualifiedModelName(
    fullyQualifiedControllerName,
  )

  const additionalImports: string[] = []
  const controllerClassName = DreamApp.system.globalClassNameFromFullyQualifiedModelName(
    fullyQualifiedControllerName,
  )

  // Determine user model variables
  const actualOwningModel = owningModel || 'User'
  const owningModelClassName = DreamApp.system.globalClassNameFromFullyQualifiedModelName(actualOwningModel)
  const owningModelProperty = `current${owningModelClassName}`

  let modelClassName: string | undefined
  let modelAttributeName: string | undefined
  let pluralizedModelAttributeName: string | undefined

  if (fullyQualifiedModelName) {
    fullyQualifiedModelName = DreamApp.system.standardizeFullyQualifiedModelName(fullyQualifiedModelName)
    modelClassName = DreamApp.system.globalClassNameFromFullyQualifiedModelName(fullyQualifiedModelName)
    modelAttributeName = camelize(modelClassName)
    pluralizedModelAttributeName = singular ? modelAttributeName : pluralize(modelAttributeName)
    additionalImports.push(importStatementForModel(fullyQualifiedModelName))
  }

  const defaultOpenapiSerializerKeyProperty = forAdmin
    ? `
    serializerKey: 'admin',`
    : ''

  const loadQueryBase: string = forAdmin
    ? (modelClassName ?? 'no-class-name')
    : `this.${owningModelProperty}.associationQuery('${pluralizedModelAttributeName}')`

  const methodDefs = actions.map(methodName => {
    switch (methodName) {
      case 'create':
        if (modelAttributeName)
          return `\
  @OpenAPI(${modelClassName}, {
    status: 201,
    tags: openApiTags,
    description: 'Create ${aOrAnDreamModelName(modelClassName!)}',${defaultOpenapiSerializerKeyProperty}
  })
  public async create() {
    // let ${modelAttributeName} = await ${forAdmin ? `${modelClassName}.create(` : `this.${owningModelProperty}.createAssociation('${pluralizedModelAttributeName}', `}this.paramsFor(${modelClassName}))
    // if (${modelAttributeName}.isPersisted) ${modelAttributeName} = await ${modelAttributeName}.loadFor('${forAdmin ? 'admin' : 'default'}').execute()
    // this.created(${modelAttributeName})
  }`
        else
          return `\
  // @OpenAPI(<model, view model, or serializer>, {
  //   status: 201,
  //   tags: openApiTags,
  //   description: '<tbd>',
  // })
  public async create() {
  }`

      case 'index':
        if (modelAttributeName)
          return `\
  @OpenAPI(${modelClassName}, {
    status: 200,
    tags: openApiTags,
    description: 'Paginated index of ${pluralize(modelClassName!)}',
    cursorPaginate: true,
    serializerKey: '${forAdmin ? 'adminSummary' : 'summary'}',
  })
  public async index() {
    // const ${pluralizedModelAttributeName} = await ${loadQueryBase}
    //   .preloadFor('${forAdmin ? 'adminSummary' : 'summary'}')
    //   .cursorPaginate({ cursor: this.castParam('cursor', 'string', { allowNull: true }) })
    // this.ok(${pluralizedModelAttributeName})
  }`
        else
          return `\
  // @OpenAPI(<model, view model, or serializer>, {
  //   status: 200,
  //   tags: openApiTags,
  //   description: '<tbd>',
  //   many: true,
  //   serializerKey: '${forAdmin ? 'adminSummary' : 'summary'}',
  // })
  public async index() {
  }`

      case 'show':
        if (modelAttributeName)
          return `\
  @OpenAPI(${modelClassName}, {
    status: 200,
    tags: openApiTags,
    description: 'Fetch ${aOrAnDreamModelName(modelClassName!)}',${defaultOpenapiSerializerKeyProperty}
  })
  public async show() {
    // const ${modelAttributeName} = await this.${modelAttributeName}()
    // this.ok(${modelAttributeName})
  }`
        else
          return `\
  // @OpenAPI(<model, view model, or serializer>, {
  //   status: 200,
  //   tags: openApiTags,
  //   description: '<tbd>',
  // })
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
    // const ${modelAttributeName} = await this.${modelAttributeName}()
    // await ${modelAttributeName}.update(this.paramsFor(${modelClassName}))
    // this.noContent()
  }`
        else
          return `\
  // @OpenAPI(<model, view model, or serializer>, {
  //   status: 204,
  //   tags: openApiTags,
  //   description: '<tbd>',
  // })
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
    // const ${modelAttributeName} = await this.${modelAttributeName}()
    // await ${modelAttributeName}.destroy()
    // this.noContent()
  }`
        else
          return `\
  // @OpenAPI({
  //   status: 204,
  //   tags: openApiTags,
  //   description: '<tbd>',
  // })
  public async destroy() {
  }`

      default:
        if (modelAttributeName)
          return `\
  @OpenAPI(${modelClassName}, {
    status: 200,
    tags: openApiTags,
    description: 'Fetch ${aOrAnDreamModelName(modelClassName!)}',
  })
  public async ${methodName}() {
    // const ${modelAttributeName} = await this.${modelAttributeName}()
    // this.ok(${modelAttributeName})
  }`
        else
          return `\
  // @OpenAPI(<model, view model, or serializer>, {
  //   status: 200,
  //   tags: openApiTags,
  //   description: '<tbd>',
  // })
  public async ${methodName}() {
  }`
    }
  })

  const openApiImport = `import { OpenAPI } from '@rvoh/psychic'`

  const openApiTags = `const openApiTags = ['${hyphenize(pluralizedModelAttributeName || controllerClassName.replace(/Controller$/, ''))}']`

  return `\
${omitOpenApi ? '' : openApiImport + '\n'}${ancestorImportStatement}${additionalImports.length ? '\n' + additionalImports.join('\n') : ''}${omitOpenApi ? '' : '\n\n' + openApiTags}

export default class ${controllerClassName} extends ${ancestorName} {
${methodDefs.join('\n\n')}${modelClassName ? privateMethods(forAdmin, modelClassName, actions, loadQueryBase, singular) : ''}
}
`
}

function privateMethods(
  forAdmin: boolean,
  modelClassName: string,
  methods: string[],
  loadQueryBase: string,
  singular: boolean,
) {
  const privateMethods: string[] = []
  if (methods.find(methodName => ['show', 'update', 'destroy'].includes(methodName)))
    privateMethods.push(loadModelStatement(forAdmin, modelClassName, loadQueryBase, singular))

  if (!privateMethods.length) return ''
  return `\n\n${privateMethods.join('\n\n')}`
}

function loadModelStatement(
  forAdmin: boolean,
  modelClassName: string,
  loadQueryBase: string,
  singular: boolean,
) {
  return `  private async ${camelize(modelClassName)}() {
    // return await ${loadQueryBase}
    //   .preloadFor('${forAdmin ? 'admin' : 'default'}')
    //   ${singular ? '.firstOrFail()' : ".findOrFail(this.castParam('id', 'string'))"}
  }`
}

function importStatementForModel(destinationModelName: string) {
  return `import ${DreamApp.system.globalClassNameFromFullyQualifiedModelName(destinationModelName)} from '${DreamApp.system.absoluteDreamPath('models', destinationModelName)}'`
}

function aOrAnDreamModelName(dreamName: string) {
  if (/^[aeiou]/.test(dreamName)) return `an ${dreamName}`
  return `a ${dreamName}`
}
