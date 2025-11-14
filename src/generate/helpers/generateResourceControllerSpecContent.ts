import { DreamApp } from '@rvoh/dream'
import { camelize, capitalize, compact, uniq } from '@rvoh/dream/utils'
import addImportSuffix from '../../helpers/path/addImportSuffix.js'
import { pluralize } from '../../package-exports/utils.js'

interface GenerateSpecOptions {
  fullyQualifiedControllerName: string
  route: string
  fullyQualifiedModelName: string
  columnsWithTypes: string[]
  owningModel?: string | undefined
  forAdmin: boolean
  singular: boolean
  actions: string[]
}

interface ModelConfiguration {
  fullyQualifiedModelName: string
  modelClassName: string
  modelVariableName: string
  userModelName: string
  userVariableName: string
  owningModelName: string
  owningModelVariableName: string
  simpleCreationCommand: string
}

interface AttributeTestData {
  attributeCreationKeyValues: string[]
  attributeUpdateKeyValues: string[]
  comparableOriginalAttributeKeyValues: string[]
  expectEqualOriginalValue: string[]
  expectEqualUpdatedValue: string[]
  expectEqualOriginalNamedVariable: string[]
  originalValueVariableAssignments: string[]
  dateAttributeIncluded: boolean
  datetimeAttributeIncluded: boolean
  dreamImports: string[]
}

interface ActionConfiguration {
  omitIndex: boolean
  omitCreate: boolean
  omitShow: boolean
  omitUpdate: boolean
  omitDestroy: boolean
}

export default function generateResourceControllerSpecContent(options: GenerateSpecOptions): string {
  const { path, pathParams } = extractPathArgsFromResourcefulPath(options.route)
  const modelConfig = createModelConfiguration(options)
  const actionConfig = createActionConfiguration(options)
  const attributeData = processAttributes(
    options.columnsWithTypes,
    modelConfig,
    options.fullyQualifiedModelName,
  )
  const imports = generateImportStatements(modelConfig, attributeData.dreamImports, options.owningModel)

  return generateSpecTemplate({
    ...options,
    path,
    pathParams,
    modelConfig,
    actionConfig,
    attributeData,
    imports,
  })
}

function createModelConfiguration(options: GenerateSpecOptions): ModelConfiguration {
  const fullyQualifiedModelName = DreamApp.system.standardizeFullyQualifiedModelName(
    options.fullyQualifiedModelName,
  )
  const modelClassName = DreamApp.system.globalClassNameFromFullyQualifiedModelName(fullyQualifiedModelName)
  const modelVariableName = camelize(modelClassName)

  const userModelName = options.forAdmin ? 'AdminUser' : 'User'
  const userVariableName = options.forAdmin ? 'adminUser' : 'user'

  const owningModelName = options.owningModel
    ? DreamApp.system.globalClassNameFromFullyQualifiedModelName(options.owningModel)
    : userModelName
  const owningModelVariableName = options.owningModel
    ? camelize(DreamApp.system.standardizeFullyQualifiedModelName(options.owningModel).split('/').pop()!)
    : userVariableName

  const simpleCreationCommand = `const ${modelVariableName} = await create${modelClassName}(${options.forAdmin ? '' : `{ ${owningModelVariableName} }`})`

  return {
    fullyQualifiedModelName,
    modelClassName,
    modelVariableName,
    userModelName,
    userVariableName,
    owningModelName,
    owningModelVariableName,
    simpleCreationCommand,
  }
}

function createActionConfiguration(options: GenerateSpecOptions): ActionConfiguration {
  return {
    omitIndex: options.singular || !options.actions.includes('index'),
    omitCreate: !options.actions.includes('create'),
    omitShow: !options.actions.includes('show'),
    omitUpdate: !options.actions.includes('update'),
    omitDestroy: !options.actions.includes('destroy'),
  }
}

function processAttributes(
  columnsWithTypes: string[],
  modelConfig: ModelConfiguration,
  fullyQualifiedModelName: string,
): AttributeTestData {
  const attributeData: AttributeTestData = {
    attributeCreationKeyValues: [],
    attributeUpdateKeyValues: [],
    comparableOriginalAttributeKeyValues: [],
    expectEqualOriginalValue: [],
    expectEqualUpdatedValue: [],
    expectEqualOriginalNamedVariable: [],
    originalValueVariableAssignments: [],
    dateAttributeIncluded: false,
    datetimeAttributeIncluded: false,
    dreamImports: [],
  }

  for (const attribute of columnsWithTypes) {
    const attributeInfo = parseAttribute(attribute)
    if (!attributeInfo) continue

    const { attributeName, attributeType, isArray, enumValues } = attributeInfo
    const dotNotationVariable = `${modelConfig.modelVariableName}.${attributeName}`

    processAttributeByType({
      attributeType,
      attributeName,
      isArray,
      enumValues,
      dotNotationVariable,
      fullyQualifiedModelName,
      attributeData,
    })

    addOriginalValueTracking(attributeType, attributeName, isArray, dotNotationVariable, attributeData)
  }

  return attributeData
}

interface ParsedAttribute {
  attributeName: string
  attributeType: string
  isArray: boolean
  enumValues?: string | undefined
}

function parseAttribute(attribute: string): ParsedAttribute | null {
  const [rawAttributeName, rawAttributeType, , enumValues] = attribute.split(':')

  if (!rawAttributeName || !rawAttributeType) return null

  // Handle belongs_to relationships
  if (rawAttributeType === 'belongs_to') {
    // For belongs_to relationships, convert "Ticketing/Ticket" to "ticket"
    const attributeName = camelize(rawAttributeName.split('/').pop()!)
    return { attributeName, attributeType: 'belongs_to', isArray: false, enumValues }
  }

  // Skip _type and _id columns, but not belongs_to relationships
  if (/(_type|_id)$/.test(rawAttributeName)) return null

  const attributeName = camelize(rawAttributeName)
  if (attributeName === 'deletedAt') return null

  const arrayBracketRegexp = /\[\]$/
  const isArray = arrayBracketRegexp.test(rawAttributeType)
  const attributeType = rawAttributeType.replace(arrayBracketRegexp, '')

  return { attributeName, attributeType, isArray, enumValues }
}

function processAttributeByType({
  attributeType,
  attributeName,
  isArray,
  enumValues,
  dotNotationVariable,
  fullyQualifiedModelName,
  attributeData,
}: {
  attributeType: string
  attributeName: string
  isArray: boolean
  enumValues?: string | undefined
  dotNotationVariable: string
  fullyQualifiedModelName: string
  attributeData: AttributeTestData
}): void {
  switch (attributeType) {
    case 'belongs_to':
      // belongs_to relationships are NOT included in comparable attributes or create/update data
      // They are only tracked for original values in update contexts
      break
    case 'enum':
      processEnumAttribute({ attributeName, isArray, enumValues, dotNotationVariable, attributeData })
      break
    case 'string':
    case 'text':
    case 'citext':
      processStringAttribute({
        attributeName,
        isArray,
        dotNotationVariable,
        fullyQualifiedModelName,
        attributeData,
      })
      break
    case 'integer':
    case 'decimal':
    case 'bigint':
      processNumericAttribute({ attributeName, attributeType, isArray, dotNotationVariable, attributeData })
      break
    case 'date':
      processDateAttribute({ attributeName, isArray, dotNotationVariable, attributeData })
      break
    case 'datetime':
      processDateTimeAttribute({ attributeName, isArray, dotNotationVariable, attributeData })
      break
  }
}

function processEnumAttribute({
  attributeName,
  isArray,
  enumValues,
  dotNotationVariable,
  attributeData,
}: {
  attributeName: string
  isArray: boolean
  enumValues?: string | undefined
  dotNotationVariable: string
  attributeData: AttributeTestData
}): void {
  const rawOriginalEnumValue = (enumValues ?? '').split(',').at(0)!
  const rawUpdatedEnumValue = (enumValues ?? '').split(',').at(-1)!
  const originalEnumValue = isArray ? [rawOriginalEnumValue] : rawOriginalEnumValue
  const updatedEnumValue = isArray ? [rawUpdatedEnumValue] : rawUpdatedEnumValue

  attributeData.comparableOriginalAttributeKeyValues.push(`${attributeName}: ${dotNotationVariable},`)

  if (attributeName !== 'type') {
    attributeData.attributeCreationKeyValues.push(`${attributeName}: ${jsonify(originalEnumValue)},`)
    attributeData.attributeUpdateKeyValues.push(`${attributeName}: ${jsonify(updatedEnumValue)},`)
    attributeData.expectEqualOriginalValue.push(
      `expect(${dotNotationVariable}).toEqual(${jsonify(originalEnumValue)})`,
    )
    attributeData.expectEqualUpdatedValue.push(
      `expect(${dotNotationVariable}).toEqual(${jsonify(updatedEnumValue)})`,
    )
  }
}

function processStringAttribute({
  attributeName,
  isArray,
  dotNotationVariable,
  fullyQualifiedModelName,
  attributeData,
}: {
  attributeName: string
  isArray: boolean
  dotNotationVariable: string
  fullyQualifiedModelName: string
  attributeData: AttributeTestData
}): void {
  const rawOriginalStringValue = `The ${fullyQualifiedModelName} ${attributeName}`
  const rawUpdatedStringValue = `Updated ${fullyQualifiedModelName} ${attributeName}`
  const originalStringValue = isArray ? [rawOriginalStringValue] : rawOriginalStringValue
  const updatedStringValue = isArray ? [rawUpdatedStringValue] : rawUpdatedStringValue

  attributeData.attributeCreationKeyValues.push(`${attributeName}: ${jsonify(originalStringValue)},`)
  attributeData.attributeUpdateKeyValues.push(`${attributeName}: ${jsonify(updatedStringValue)},`)
  attributeData.comparableOriginalAttributeKeyValues.push(`${attributeName}: ${dotNotationVariable},`)
  attributeData.expectEqualOriginalValue.push(
    `expect(${dotNotationVariable}).toEqual(${jsonify(originalStringValue)})`,
  )
  attributeData.expectEqualUpdatedValue.push(
    `expect(${dotNotationVariable}).toEqual(${jsonify(updatedStringValue)})`,
  )
}

function processNumericAttribute({
  attributeName,
  attributeType,
  isArray,
  dotNotationVariable,
  attributeData,
}: {
  attributeName: string
  attributeType: string
  isArray: boolean
  dotNotationVariable: string
  attributeData: AttributeTestData
}): void {
  const rawOriginalValue =
    attributeType === 'integer' ? 1 : attributeType === 'decimal' ? 1.1 : '11111111111111111'
  const rawUpdatedValue =
    attributeType === 'integer' ? 2 : attributeType === 'decimal' ? 2.2 : '22222222222222222'
  const originalValue = isArray ? [rawOriginalValue] : rawOriginalValue
  const updatedValue = isArray ? [rawUpdatedValue] : rawUpdatedValue

  attributeData.attributeCreationKeyValues.push(`${attributeName}: ${jsonify(originalValue)},`)
  attributeData.attributeUpdateKeyValues.push(`${attributeName}: ${jsonify(updatedValue)},`)
  attributeData.comparableOriginalAttributeKeyValues.push(`${attributeName}: ${dotNotationVariable},`)
  attributeData.expectEqualOriginalValue.push(
    `expect(${dotNotationVariable}).toEqual(${jsonify(originalValue)})`,
  )
  attributeData.expectEqualUpdatedValue.push(
    `expect(${dotNotationVariable}).toEqual(${jsonify(updatedValue)})`,
  )
}

function processDateAttribute({
  attributeName,
  isArray,
  dotNotationVariable,
  attributeData,
}: {
  attributeName: string
  isArray: boolean
  dotNotationVariable: string
  attributeData: AttributeTestData
}): void {
  attributeData.dreamImports.push('CalendarDate')
  attributeData.dateAttributeIncluded = true

  attributeData.attributeCreationKeyValues.push(
    `${attributeName}: ${isArray ? '[today.toISO()]' : 'today.toISO()'},`,
  )
  attributeData.attributeUpdateKeyValues.push(
    `${attributeName}: ${isArray ? '[yesterday.toISO()]' : 'yesterday.toISO()'},`,
  )
  attributeData.comparableOriginalAttributeKeyValues.push(
    `${attributeName}: ${dotNotationVariable}${isArray ? '.map(date => date.toISO())' : '.toISO()'},`,
  )
  attributeData.expectEqualOriginalValue.push(
    `expect(${dotNotationVariable}${isArray ? '[0]' : ''}).toEqualCalendarDate(today)`,
  )
  attributeData.expectEqualUpdatedValue.push(
    `expect(${dotNotationVariable}${isArray ? '[0]' : ''}).toEqualCalendarDate(yesterday)`,
  )
}

function processDateTimeAttribute({
  attributeName,
  isArray,
  dotNotationVariable,
  attributeData,
}: {
  attributeName: string
  isArray: boolean
  dotNotationVariable: string
  attributeData: AttributeTestData
}): void {
  attributeData.dreamImports.push('DateTime')
  attributeData.datetimeAttributeIncluded = true

  attributeData.attributeCreationKeyValues.push(
    `${attributeName}: ${isArray ? '[now.toISO()]' : 'now.toISO()'},`,
  )
  attributeData.attributeUpdateKeyValues.push(
    `${attributeName}: ${isArray ? '[lastHour.toISO()]' : 'lastHour.toISO()'},`,
  )
  attributeData.comparableOriginalAttributeKeyValues.push(
    `${attributeName}: ${dotNotationVariable}${isArray ? '.map(datetime => datetime.toISO())' : '.toISO()'},`,
  )
  attributeData.expectEqualOriginalValue.push(
    `expect(${dotNotationVariable}${isArray ? '[0]' : ''}).toEqualDateTime(now)`,
  )
  attributeData.expectEqualUpdatedValue.push(
    `expect(${dotNotationVariable}${isArray ? '[0]' : ''}).toEqualDateTime(lastHour)`,
  )
}

function addOriginalValueTracking(
  attributeType: string,
  attributeName: string,
  isArray: boolean,
  dotNotationVariable: string,
  attributeData: AttributeTestData,
): void {
  const hardToCompareArray = (attributeType === 'date' || attributeType === 'datetime') && isArray

  // Exclude belongs_to relationships from original value tracking
  if (!hardToCompareArray && attributeName !== 'type' && attributeType !== 'belongs_to') {
    const originalAttributeVariableName = `original${capitalize(attributeName)}`
    attributeData.originalValueVariableAssignments.push(
      `const ${originalAttributeVariableName} = ${dotNotationVariable}`,
    )
    attributeData.expectEqualOriginalNamedVariable.push(
      `expect(${dotNotationVariable}).toEqual(${originalAttributeVariableName})`,
    )
  }
}

function generateImportStatements(
  modelConfig: ModelConfiguration,
  dreamImports: string[],
  owningModel?: string,
): string {
  const importStatements: string[] = compact([
    importStatementForModel(modelConfig.fullyQualifiedModelName),
    importStatementForModel(modelConfig.userModelName),
    owningModel ? importStatementForModel(owningModel) : undefined,
    importStatementForModelFactory(modelConfig.fullyQualifiedModelName),
    importStatementForModelFactory(modelConfig.userModelName),
    owningModel ? importStatementForModelFactory(owningModel) : undefined,
  ])

  const dreamImportLine = dreamImports.length
    ? `import { ${uniq(dreamImports).join(', ')} } from '@rvoh/dream'\n`
    : ''

  return `${dreamImportLine}${uniq(importStatements).join('\n')}
import { RequestBody, session, SpecRequestType } from '@spec/unit/helpers/${addImportSuffix('authentication.js')}'`
}

interface TemplateOptions extends GenerateSpecOptions {
  path: string
  pathParams: string[]
  modelConfig: ModelConfiguration
  actionConfig: ActionConfiguration
  attributeData: AttributeTestData
  imports: string
}

function generateSpecTemplate(options: TemplateOptions): string {
  const { fullyQualifiedControllerName, modelConfig, imports, owningModel } = options

  return `${imports}

describe('${fullyQualifiedControllerName}', () => {
  let request: SpecRequestType
  let ${modelConfig.userVariableName}: ${modelConfig.userModelName}${owningModel ? `\n  let ${modelConfig.owningModelVariableName}: ${modelConfig.owningModelName}` : ''}

  beforeEach(async () => {
    ${modelConfig.userVariableName} = await create${modelConfig.userModelName}()${owningModel ? `\n    ${modelConfig.owningModelVariableName} = await create${modelConfig.owningModelName}({ ${modelConfig.userVariableName} })` : ''}
    request = await session(${modelConfig.userVariableName})
  })${generateIndexActionSpec(options)}${generateShowActionSpec(options)}${generateCreateActionSpec(options)}${generateUpdateActionSpec(options)}${generateDestroyActionSpec(options)}
})
`
}

function generateIndexActionSpec(options: TemplateOptions): string {
  if (options.actionConfig.omitIndex) return ''

  const { path, pathParams, modelConfig, fullyQualifiedModelName, singular, forAdmin } = options
  const subjectFunctionName = `index${pluralize(modelConfig.modelClassName)}`

  return `

  describe('GET index', () => {
    const ${subjectFunctionName} = async <StatusCode extends 200 | 400 | 404>(expectedStatus: StatusCode) => {
      return request.get('/${path}', expectedStatus${formatPathParams(pathParams)})
    }

    it('returns the index of ${fullyQualifiedModelName}s', async () => {
      ${modelConfig.simpleCreationCommand}

      const { body } = await ${subjectFunctionName}(200)

      expect(body.results).toEqual([
        expect.objectContaining({
          id: ${modelConfig.modelVariableName}.id,
        }),
      ])
    })${
      singular || forAdmin
        ? ''
        : `

    context('${modelConfig.modelClassName}s created by another ${modelConfig.owningModelName}', () => {
      it('are omitted', async () => {
        await create${modelConfig.modelClassName}()

        const { body } = await ${subjectFunctionName}(200)

        expect(body.results).toEqual([])
      })
    })`
    }
  })`
}

function generateShowActionSpec(options: TemplateOptions): string {
  if (options.actionConfig.omitShow) return ''

  const { path, pathParams, modelConfig, fullyQualifiedModelName, singular, forAdmin, attributeData } =
    options
  const subjectFunctionName = `show${modelConfig.modelClassName}`

  const subjectFunction = singular
    ? `
    const ${subjectFunctionName} = async <StatusCode extends 200 | 400 | 404>(expectedStatus: StatusCode) => {
      return request.get('/${path}', expectedStatus${formatPathParams(pathParams)})
    }`
    : `
    const ${subjectFunctionName} = async <StatusCode extends 200 | 400 | 404>(${modelConfig.modelVariableName}: ${modelConfig.modelClassName}, expectedStatus: StatusCode) => {
      return request.get('/${path}/{id}', expectedStatus, ${formatPathParamsWithId(pathParams, modelConfig.modelVariableName)})
    }`

  return `

  describe('GET show', () => {${subjectFunction}

    it('returns the ${singular ? `${fullyQualifiedModelName} belonging to the ${modelConfig.owningModelName}` : `specified ${fullyQualifiedModelName}`}', async () => {
      ${modelConfig.simpleCreationCommand}

      const { body } = await ${subjectFunctionName}(${singular ? '' : `${modelConfig.modelVariableName}, `}200)

      expect(body).toEqual(
        expect.objectContaining({
          id: ${modelConfig.modelVariableName}.id,${attributeData.comparableOriginalAttributeKeyValues.length ? '\n          ' + attributeData.comparableOriginalAttributeKeyValues.join('\n          ') : ''}
        }),
      )
    })${
      singular || forAdmin
        ? ''
        : `

    context('${fullyQualifiedModelName} created by another ${modelConfig.owningModelName}', () => {
      it('is not found', async () => {
        const other${modelConfig.owningModelName}${modelConfig.modelClassName} = await create${modelConfig.modelClassName}()

        await ${subjectFunctionName}(other${modelConfig.owningModelName}${modelConfig.modelClassName}, 404)
      })
    })`
    }
  })`
}

function generateCreateActionSpec(options: TemplateOptions): string {
  if (options.actionConfig.omitCreate) return ''

  const { path, pathParams, modelConfig, fullyQualifiedModelName, forAdmin, singular, attributeData } =
    options
  const subjectFunctionName = `create${modelConfig.modelClassName}`

  const dateTimeSetup = `${
    attributeData.dateAttributeIncluded
      ? `
      const today = CalendarDate.today()`
      : ''
  }${
    attributeData.datetimeAttributeIncluded
      ? `
      const now = DateTime.now()`
      : ''
  }${attributeData.dateAttributeIncluded || attributeData.datetimeAttributeIncluded ? '\n' : ''}`

  const modelQuery = forAdmin
    ? `${modelConfig.modelClassName}.firstOrFail()`
    : `${modelConfig.owningModelVariableName}.associationQuery('${singular ? modelConfig.modelVariableName : pluralize(modelConfig.modelVariableName)}').firstOrFail()`

  return `

  describe('POST create', () => {
    const ${subjectFunctionName} = async <StatusCode extends 201 | 400 | 404>(
      data: RequestBody<'post', '/${path}'>,
      expectedStatus: StatusCode
    ) => {
      return request.post('/${path}', expectedStatus, {${formatPathParamsForRequest(pathParams)}
        data
      })
    }

    it('creates a ${fullyQualifiedModelName}${forAdmin ? '' : ` for this ${modelConfig.owningModelName}`}', async () => {${dateTimeSetup}
      const { body } = await ${subjectFunctionName}({
        ${attributeData.attributeCreationKeyValues.join('\n        ')}
      }, 201)

      const ${modelConfig.modelVariableName} = await ${modelQuery}${attributeData.expectEqualOriginalValue.length ? '\n      ' + attributeData.expectEqualOriginalValue.join('\n      ') : ''}

      expect(body).toEqual(
        expect.objectContaining({
          id: ${modelConfig.modelVariableName}.id,${attributeData.comparableOriginalAttributeKeyValues.length ? '\n          ' + attributeData.comparableOriginalAttributeKeyValues.join('\n          ') : ''}
        }),
      )
    })
  })`
}

function generateUpdateActionSpec(options: TemplateOptions): string {
  if (options.actionConfig.omitUpdate) return ''

  const { path, pathParams, modelConfig, fullyQualifiedModelName, singular, forAdmin, attributeData } =
    options
  const subjectFunctionName = `update${modelConfig.modelClassName}`

  const dateTimeSetup = `${
    attributeData.dateAttributeIncluded
      ? `
      const yesterday = CalendarDate.yesterday()`
      : ''
  }${
    attributeData.datetimeAttributeIncluded
      ? `
      const lastHour = DateTime.now().minus({ hour: 1 })`
      : ''
  }${attributeData.dateAttributeIncluded || attributeData.datetimeAttributeIncluded ? '\n' : ''}`

  const subjectFunction = singular
    ? `
    const ${subjectFunctionName} = async <StatusCode extends 204 | 400 | 404>(
      data: RequestBody<'patch', '/${path}'>,
      expectedStatus: StatusCode
    ) => {
      return request.patch('/${path}', expectedStatus, {${formatPathParamsForRequest(pathParams)}
        data,
      })
    }`
    : `
    const ${subjectFunctionName} = async <StatusCode extends 204 | 400 | 404>(
      ${modelConfig.modelVariableName}: ${modelConfig.modelClassName},
      data: RequestBody<'patch', '/${path}/{id}'>,
      expectedStatus: StatusCode
    ) => {
      return request.patch('/${path}/{id}', expectedStatus, {${formatPathParamsForRequest(pathParams)}
        id: ${modelConfig.modelVariableName}.id,
        data,
      })
    }`

  const updateContextSpec =
    singular || forAdmin
      ? ''
      : `

    context('a ${fullyQualifiedModelName} created by another ${modelConfig.owningModelName}', () => {
      it('is not updated', async () => {${
        attributeData.dateAttributeIncluded
          ? `
        const yesterday = CalendarDate.yesterday()`
          : ''
      }${
        attributeData.datetimeAttributeIncluded
          ? `
        const lastHour = DateTime.now().minus({ hour: 1 })`
          : ''
      }${attributeData.dateAttributeIncluded || attributeData.datetimeAttributeIncluded ? '\n' : ''}
        const ${modelConfig.modelVariableName} = await create${modelConfig.modelClassName}()
        ${attributeData.originalValueVariableAssignments.length ? attributeData.originalValueVariableAssignments.join('\n        ') : ''}

        await ${subjectFunctionName}(${modelConfig.modelVariableName}, {
          ${attributeData.attributeUpdateKeyValues.length ? attributeData.attributeUpdateKeyValues.join('\n          ') : ''}
        }, 404)

        await ${modelConfig.modelVariableName}.reload()
        ${attributeData.expectEqualOriginalNamedVariable.join('\n        ')}
      })
    })`

  return `

  describe('PATCH update', () => {${subjectFunction}

    it('updates the ${fullyQualifiedModelName}', async () => {${dateTimeSetup}
      ${modelConfig.simpleCreationCommand}

      await ${subjectFunctionName}(${singular ? '' : `${modelConfig.modelVariableName}, `}{
        ${attributeData.attributeUpdateKeyValues.length ? attributeData.attributeUpdateKeyValues.join('\n        ') : ''}
      }, 204)

      await ${modelConfig.modelVariableName}.reload()
      ${attributeData.expectEqualUpdatedValue.join('\n      ')}
    })${updateContextSpec}
  })`
}

function generateDestroyActionSpec(options: TemplateOptions): string {
  if (options.actionConfig.omitDestroy) return ''

  const { path, pathParams, modelConfig, fullyQualifiedModelName, singular, forAdmin } = options
  const subjectFunctionName = `destroy${modelConfig.modelClassName}`

  const subjectFunction = singular
    ? `
    const ${subjectFunctionName} = async <StatusCode extends 204 | 400 | 404>(expectedStatus: StatusCode) => {
      return request.delete('/${path}', expectedStatus${formatPathParams(pathParams)})
    }`
    : `
    const ${subjectFunctionName} = async <StatusCode extends 204 | 400 | 404>(${modelConfig.modelVariableName}: ${modelConfig.modelClassName}, expectedStatus: StatusCode) => {
      return request.delete('/${path}/{id}', expectedStatus, ${formatPathParamsWithId(pathParams, modelConfig.modelVariableName)})
    }`

  const destroyContextSpec =
    singular || forAdmin
      ? ''
      : `

    context('a ${fullyQualifiedModelName} created by another ${modelConfig.owningModelName}', () => {
      it('is not deleted', async () => {
        const ${modelConfig.modelVariableName} = await create${modelConfig.modelClassName}()

        await ${subjectFunctionName}(${modelConfig.modelVariableName}, 404)

        expect(await ${modelConfig.modelClassName}.find(${modelConfig.modelVariableName}.id)).toMatchDreamModel(${modelConfig.modelVariableName})
      })
    })`

  return `

  describe('DELETE destroy', () => {${subjectFunction}

    it('deletes the ${fullyQualifiedModelName}', async () => {
      ${modelConfig.simpleCreationCommand}

      await ${subjectFunctionName}(${singular ? '' : `${modelConfig.modelVariableName}, `}204)

      expect(await ${modelConfig.modelClassName}.find(${modelConfig.modelVariableName}.id)).toBeNull()
    })${destroyContextSpec}
  })`
}

function importStatementForModel(destinationModelName: string) {
  return `import ${DreamApp.system.globalClassNameFromFullyQualifiedModelName(destinationModelName)} from '${DreamApp.system.absoluteDreamPath('models', destinationModelName)}'`
}

function importStatementForModelFactory(destinationModelName: string) {
  return `import create${DreamApp.system.globalClassNameFromFullyQualifiedModelName(destinationModelName)} from '${DreamApp.system.absoluteDreamPath('factories', destinationModelName)}'`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function jsonify(val: any) {
  return JSON.stringify(val).replace(/"/g, "'")
}

function formatPathParams(pathParams: string[]): string {
  return pathParams.length
    ? `, {
        ${pathParams.join(',\n        ')},
      }`
    : ''
}

function formatPathParamsWithId(pathParams: string[], modelVariableName: string): string {
  return pathParams.length
    ? `{
        ${pathParams.join(',\n        ')},
        id: ${modelVariableName}.id,
      }`
    : `{
        id: ${modelVariableName}.id,
      }`
}

function formatPathParamsForRequest(pathParams: string[]): string {
  return pathParams.length
    ? `
        ${pathParams.join(',\n        ')},`
    : ''
}

function extractPathArgsFromResourcefulPath(route: string) {
  const pathParts = route.split('/')
  const pathParamRegexp = /^\{[^}]*\}$/

  const pathParams: string[] = []
  const mappedPathParts = pathParts.map((pathPart, index) => {
    const parentPart = pathParts[index - 1]
    if (parentPart && pathParamRegexp.test(pathPart)) {
      const parentName = pluralize.singular(camelize(parentPart))
      const parentId = `${parentName}Id`
      pathParams.push(`${parentId}: ${parentName}.id`)
      return `{${parentId}}`
    } else {
      return pathPart
    }
  })

  return { path: mappedPathParts.join('/'), pathParams }
}
