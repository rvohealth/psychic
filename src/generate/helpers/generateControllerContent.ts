import { DreamApp } from '@rvoh/dream'
import { camelize, hyphenize } from '@rvoh/dream/utils'
import pluralize from 'pluralize-esm'
import paramSafeColumnNamesFromCliTokens from './paramSafeColumnNamesFromCliTokens.js'

export type ParamExtractionStrategy = 'explicit' | 'implicit'

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
  paramExtractionStrategy,
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
  paramExtractionStrategy?: ParamExtractionStrategy | undefined
}) {
  // Admin scaffolds lean on the model's declared paramSafeColumns (implicit);
  // non-admin scaffolds require an explicit allowlist at the call site so the
  // permitted columns are visible to reviewers. Either default can be overridden
  // via the `--with-extract-params` / `--with-extract-implicit-params` CLI flags,
  // which get materialized into `paramExtractionStrategy` by the caller.
  const resolvedExtractionStrategy: ParamExtractionStrategy =
    paramExtractionStrategy ?? (forAdmin ? 'implicit' : 'explicit')
  /**
   * Returns the `this.extract*Params(...)` expression that replaces the legacy
   * `this.paramsFor(Model)` in the scaffold's commented hints. Does NOT include
   * the outer closing paren that the surrounding call expects (e.g. the one
   * closing `update(...)` or `create(...)` or `createAssociation(...)`); the
   * caller appends that as part of its own template.
   */
  const extractCallExpression = (modelClass: string) => {
    if (resolvedExtractionStrategy === 'implicit') {
      return `this.extractImplicitParams(${modelClass})`
    }
    const safeColumns = paramSafeColumnNamesFromCliTokens(columnsWithTypes)
    const serializedSafeColumns = safeColumns.length
      ? `[${safeColumns.map(name => `'${name}'`).join(', ')}]`
      : '[]'
    // The emitted list contains every implicitly-allowed column. When
    // uncommenting the action body, the developer or agent is responsible
    // for narrowing it down to only the columns this action should actually
    // accept.
    return `this.extractParams(${modelClass},
    //   ${serializedSafeColumns},
    // )`
  }
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
    : forInternal
      ? `
    serializerKey: 'internal',`
      : ''

  const useDirectModelAccess = (forAdmin || forInternal) && !owningModel
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

  return `\
${omitOpenApi ? '' : openApiImport + '\n'}${ancestorImportStatement}${additionalImports.length ? '\n' + additionalImports.join('\n') : ''}${omitOpenApi ? '' : '\n\n' + openApiTags}

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
