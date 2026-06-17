import { DreamApp } from '@rvoh/dream'
import { camelize, hyphenize } from '@rvoh/dream/utils'
import pluralize from 'pluralize-esm'
import paramSafeColumnNamesFromCliTokens from './paramSafeColumnNamesFromCliTokens.js'

export default function generateControllerContent({
  ancestorName,
  ancestorImportStatement,
  fullyQualifiedControllerName,
  fullyQualifiedModelName,
  actions = [],
  omitOpenApi = false,
  owningModel,
  forAdmin,
  forInternal = false,
  singular,
  columnsWithTypes = [],
}: {
  ancestorName: string
  ancestorImportStatement: string
  fullyQualifiedControllerName: string
  fullyQualifiedModelName?: string | undefined
  actions?: string[] | undefined
  omitOpenApi?: boolean | undefined
  owningModel?: string | undefined
  forAdmin: boolean
  forInternal?: boolean
  singular: boolean
  columnsWithTypes?: string[]
}) {
  // The scaffold emits a `paramSafeColumns` const at the top of the file
  // (alongside `openApiTags`) and references it from both the `create` and
  // `update` action hints. The list contains every implicitly-allowed column;
  // when uncommenting the action body, the developer or agent is responsible
  // for narrowing the const down to only the columns the actions should
  // actually accept.
  const extractCallExpression = (modelClass: string) => `this.extractParams(${modelClass}, paramSafeColumns)`
  fullyQualifiedControllerName = DreamApp.system.standardizeFullyQualifiedModelName(
    fullyQualifiedControllerName,
  )

  const additionalImports: string[] = []
  const controllerClassName = DreamApp.system.globalClassNameFromFullyQualifiedModelName(
    fullyQualifiedControllerName,
  )

  // Determine user model variables. Internal-namespaced controllers scope to
  // the current internal user the same way default controllers scope to the
  // current user; only the Admin namespace bypasses owner scoping entirely.
  const actualOwningModel = owningModel || (forInternal ? 'InternalUser' : 'User')
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
    : forInternal
      ? `
    serializerKey: 'internal',`
      : ''

  const useDirectModelAccess = forAdmin && !owningModel
  const loadQueryBase: string = useDirectModelAccess
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
    fastJsonStringify: true,
    requestBody: {
      only: paramSafeColumns,
    },
  })
  public async create() {
    // let ${modelAttributeName} = await ${useDirectModelAccess ? `${modelClassName}.create(` : `this.${owningModelProperty}.createAssociation('${pluralizedModelAttributeName}', `}${extractCallExpression(modelClassName!)})
    // if (${modelAttributeName}.isPersisted) ${modelAttributeName} = await ${modelAttributeName}.loadFor('${forAdmin ? 'admin' : forInternal ? 'internal' : 'default'}').execute()
    // this.created(${modelAttributeName})
  }`
        else
          return `\
  // @OpenAPI(<model, view model, or serializer>, {
  //   status: 201,
  //   tags: openApiTags,
  //   description: '<tbd>',
  //   fastJsonStringify: true,
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
    serializerKey: '${forAdmin ? 'adminSummary' : forInternal ? 'internalSummary' : 'summary'}',
    fastJsonStringify: true,
  })
  public async index() {
    // const ${pluralizedModelAttributeName} = await ${loadQueryBase}
    //   .preloadFor('${forAdmin ? 'adminSummary' : forInternal ? 'internalSummary' : 'summary'}')
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
  //   serializerKey: '${forAdmin ? 'adminSummary' : forInternal ? 'internalSummary' : 'summary'}',
  //   fastJsonStringify: true,
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
    fastJsonStringify: true,
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
  //   fastJsonStringify: true,
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
    fastJsonStringify: true,
    requestBody: {
      only: paramSafeColumns,
    },
  })
  public async update() {
    // const ${modelAttributeName} = await this.${modelAttributeName}()
    // await ${modelAttributeName}.update(${extractCallExpression(modelClassName!)})
    // this.noContent()
  }`
        else
          return `\
  // @OpenAPI(<model, view model, or serializer>, {
  //   status: 204,
  //   tags: openApiTags,
  //   description: '<tbd>',
  //   fastJsonStringify: true,
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
    fastJsonStringify: true,
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
  //   fastJsonStringify: true,
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
    fastJsonStringify: true,
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
  //   fastJsonStringify: true,
  // })
  public async ${methodName}() {
  }`
    }
  })

  const openApiImport = `import { OpenAPI } from '@rvoh/psychic'`

  const openApiTags = `const openApiTags = ['${hyphenize(pluralizedModelAttributeName || controllerClassName.replace(/Controller$/, ''))}']`

  const emitParamSafeColumns =
    !!modelClassName && actions.some(action => action === 'create' || action === 'update')
  const safeColumns = emitParamSafeColumns ? paramSafeColumnNamesFromCliTokens(columnsWithTypes) : []
  // The const is typed against the model's safe-column names rather than
  // `as const`, so editing the array literal gives the developer (or agent)
  // autocomplete of valid columns and a compile error on anything that is
  // not param-safe — directly in the assignment, no call-site round-trip.
  const paramSafeColumnsDecl = !emitParamSafeColumns
    ? ''
    : `\n\nconst paramSafeColumns: DreamParamSafeColumnNames<${modelClassName}>[] = [${safeColumns.map(name => `'${name}'`).join(', ')}]`
  const dreamTypesImport = emitParamSafeColumns
    ? `import { DreamParamSafeColumnNames } from '@rvoh/dream/types'\n`
    : ''

  return `\
${omitOpenApi ? '' : openApiImport + '\n' + dreamTypesImport}${ancestorImportStatement}${additionalImports.length ? '\n' + additionalImports.join('\n') : ''}${omitOpenApi ? '' : '\n\n' + openApiTags}${paramSafeColumnsDecl}

export default class ${controllerClassName} extends ${ancestorName} {
${methodDefs.join('\n\n')}${modelClassName ? privateMethods(forAdmin, forInternal, modelClassName, actions, loadQueryBase, singular) : ''}
}
`
}

function privateMethods(
  forAdmin: boolean,
  forInternal: boolean,
  modelClassName: string,
  methods: string[],
  loadQueryBase: string,
  singular: boolean,
) {
  const privateMethods: string[] = []
  if (methods.find(methodName => ['show', 'update', 'destroy'].includes(methodName)))
    privateMethods.push(loadModelStatement(forAdmin, forInternal, modelClassName, loadQueryBase, singular))

  if (!privateMethods.length) return ''
  return `\n\n${privateMethods.join('\n\n')}`
}

function loadModelStatement(
  forAdmin: boolean,
  forInternal: boolean,
  modelClassName: string,
  loadQueryBase: string,
  singular: boolean,
) {
  return `  private async ${camelize(modelClassName)}() {
    // return await ${loadQueryBase}
    //   .preloadFor('${forAdmin ? 'admin' : forInternal ? 'internal' : 'default'}')
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
