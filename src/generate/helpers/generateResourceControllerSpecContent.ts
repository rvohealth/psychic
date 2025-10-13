import {
  camelize,
  capitalize,
  compact,
  globalClassNameFromFullyQualifiedModelName,
  standardizeFullyQualifiedModelName,
  uniq,
} from '@rvoh/dream'
import addImportSuffix from '../../helpers/path/addImportSuffix.js'
import relativePsychicPath from '../../helpers/path/relativePsychicPath.js'
import updirsFromPath from '../../helpers/path/updirsFromPath.js'
import { pluralize } from '../../index.js'

export default function generateResourceControllerSpecContent({
  fullyQualifiedControllerName,
  route,
  fullyQualifiedModelName,
  columnsWithTypes,
  owningModel,
  forAdmin,
  singular,
  actions,
}: {
  fullyQualifiedControllerName: string
  route: string
  fullyQualifiedModelName: string
  columnsWithTypes: string[]
  owningModel?: string | undefined
  forAdmin: boolean
  singular: boolean
  actions: string[]
}) {
  fullyQualifiedModelName = standardizeFullyQualifiedModelName(fullyQualifiedModelName)
  const modelClassName = globalClassNameFromFullyQualifiedModelName(fullyQualifiedModelName)
  const modelVariableName = camelize(modelClassName)

  // Always use User for authentication
  const userModelName = forAdmin ? 'AdminUser' : 'User'
  const userVariableName = forAdmin ? 'adminUser' : 'user'

  // Determine attached model settings if provided
  const owningModelName = owningModel
    ? globalClassNameFromFullyQualifiedModelName(owningModel)
    : userModelName
  const owningModelVariableName = owningModelName ? camelize(owningModelName) : userVariableName

  const dreamImports: string[] = []

  const importStatements: string[] = compact([
    importStatementForModel(fullyQualifiedControllerName, fullyQualifiedModelName),
    importStatementForModel(fullyQualifiedControllerName, userModelName),
    owningModel ? importStatementForModel(fullyQualifiedControllerName, owningModel) : undefined,
    importStatementForModelFactory(fullyQualifiedControllerName, fullyQualifiedModelName),
    importStatementForModelFactory(fullyQualifiedControllerName, userModelName),
    owningModel ? importStatementForModelFactory(fullyQualifiedControllerName, owningModel) : undefined,
  ])

  const specUnitUpdirs = updirsFromPath(fullyQualifiedControllerName)

  const attributeCreationKeyValues: string[] = []
  const attributeUpdateKeyValues: string[] = []

  const comparableOriginalAttributeKeyValues: string[] = []

  const expectEqualOriginalValue: string[] = []
  const expectEqualUpdatedValue: string[] = []

  const expectEqualOriginalNamedVariable: string[] = []

  const originalValueVariableAssignments: string[] = []
  const keyWithDotValue: string[] = []

  let dateAttributeIncluded: boolean = false
  let datetimeAttributeIncluded: boolean = false

  for (const attribute of columnsWithTypes) {
    const [rawAttributeName, rawAttributeType, , enumValues] = attribute.split(':')
    if (/(_type|_id)$/.test(rawAttributeName ?? '')) continue
    const attributeName = camelize(rawAttributeName ?? '')
    const dotNotationVariable = `${modelVariableName}.${attributeName}`

    if (!rawAttributeType) continue
    const arrayBracketRegexp = /\[\]$/
    const isArray = arrayBracketRegexp.test(rawAttributeType)
    const attributeType = rawAttributeType.replace(arrayBracketRegexp, '')

    if (attributeName === 'deletedAt') continue

    switch (attributeType) {
      case 'enum': {
        const rawOriginalEnumValue = (enumValues ?? '').split(',').at(0)!
        const rawUpdatedEnumValue = (enumValues ?? '').split(',').at(-1)!
        const originalEnumValue = isArray ? [rawOriginalEnumValue] : rawOriginalEnumValue
        const updatedEnumValue = isArray ? [rawUpdatedEnumValue] : rawUpdatedEnumValue

        attributeCreationKeyValues.push(`${attributeName}: ${jsonify(originalEnumValue)},`)
        attributeUpdateKeyValues.push(`${attributeName}: ${jsonify(updatedEnumValue)},`)

        comparableOriginalAttributeKeyValues.push(`${attributeName}: ${dotNotationVariable},`)

        expectEqualOriginalValue.push(`expect(${dotNotationVariable}).toEqual(${jsonify(originalEnumValue)})`)
        expectEqualUpdatedValue.push(`expect(${dotNotationVariable}).toEqual(${jsonify(updatedEnumValue)})`)

        break
      }

      case 'string':
      case 'text':
      case 'citext': {
        const rawOriginalStringValue = `The ${fullyQualifiedModelName} ${attributeName}`
        const rawUpdatedStringValue = `Updated ${fullyQualifiedModelName} ${attributeName}`
        const originalStringValue = isArray ? [rawOriginalStringValue] : rawOriginalStringValue
        const updatedStringValue = isArray ? [rawUpdatedStringValue] : rawUpdatedStringValue

        attributeCreationKeyValues.push(`${attributeName}: ${jsonify(originalStringValue)},`)
        attributeUpdateKeyValues.push(`${attributeName}: ${jsonify(updatedStringValue)},`)

        comparableOriginalAttributeKeyValues.push(`${attributeName}: ${dotNotationVariable},`)

        expectEqualOriginalValue.push(
          `expect(${dotNotationVariable}).toEqual(${jsonify(originalStringValue)})`,
        )
        expectEqualUpdatedValue.push(`expect(${dotNotationVariable}).toEqual(${jsonify(updatedStringValue)})`)
        break
      }

      case 'integer':
      case 'decimal':
      case 'bigint': {
        const rawOriginalValue =
          attributeType === 'integer' ? 1 : attributeType === 'decimal' ? 1.1 : '11111111111111111'
        const rawUpdatedValue =
          attributeType === 'integer' ? 2 : attributeType === 'decimal' ? 2.2 : '22222222222222222'

        const originalValue = isArray ? [rawOriginalValue] : rawOriginalValue
        const updatedValue = isArray ? [rawUpdatedValue] : rawUpdatedValue

        attributeCreationKeyValues.push(`${attributeName}: ${jsonify(originalValue)},`)
        attributeUpdateKeyValues.push(`${attributeName}: ${jsonify(updatedValue)},`)

        comparableOriginalAttributeKeyValues.push(`${attributeName}: ${dotNotationVariable},`)

        expectEqualOriginalValue.push(`expect(${dotNotationVariable}).toEqual(${jsonify(originalValue)})`)
        expectEqualUpdatedValue.push(`expect(${dotNotationVariable}).toEqual(${jsonify(updatedValue)})`)

        break
      }

      case 'date': {
        dreamImports.push('CalendarDate')
        dateAttributeIncluded = true

        attributeCreationKeyValues.push(`${attributeName}: ${isArray ? '[today.toISO()]' : 'today.toISO()'},`)
        attributeUpdateKeyValues.push(
          `${attributeName}: ${isArray ? '[yesterday.toISO()]' : 'yesterday.toISO()'},`,
        )

        comparableOriginalAttributeKeyValues.push(
          `${attributeName}: ${dotNotationVariable}${isArray ? '.map(date => date.toISO())' : '.toISO()'},`,
        )

        expectEqualOriginalValue.push(
          `expect(${dotNotationVariable}${isArray ? '[0]' : ''}).toEqualCalendarDate(today)`,
        )
        expectEqualUpdatedValue.push(
          `expect(${dotNotationVariable}${isArray ? '[0]' : ''}).toEqualCalendarDate(yesterday)`,
        )
        break
      }

      case 'datetime': {
        dreamImports.push('DateTime')
        datetimeAttributeIncluded = true

        attributeCreationKeyValues.push(`${attributeName}: ${isArray ? '[now.toISO()]' : 'now.toISO()'},`)
        attributeUpdateKeyValues.push(
          `${attributeName}: ${isArray ? '[lastHour.toISO()]' : 'lastHour.toISO()'},`,
        )

        comparableOriginalAttributeKeyValues.push(
          `${attributeName}: ${dotNotationVariable}${isArray ? '.map(datetime => datetime.toISO())' : '.toISO()'},`,
        )

        expectEqualOriginalValue.push(
          `expect(${dotNotationVariable}${isArray ? '[0]' : ''}).toEqualDateTime(now)`,
        )
        expectEqualUpdatedValue.push(
          `expect(${dotNotationVariable}${isArray ? '[0]' : ''}).toEqualDateTime(lastHour)`,
        )
        break
      }

      default:
        continue
    }

    keyWithDotValue.push(`${attributeName}: ${dotNotationVariable},`)

    if (!((attributeType === 'date' || attributeType === 'datetime') && isArray)) {
      const originalAttributeVariableName = 'original' + capitalize(attributeName)
      originalValueVariableAssignments.push(`const ${originalAttributeVariableName} = ${dotNotationVariable}`)
      expectEqualOriginalNamedVariable.push(
        `expect(${dotNotationVariable}).toEqual(${originalAttributeVariableName})`,
      )
    }
  }

  const simpleCreationCommand = `const ${modelVariableName} = await create${modelClassName}(${forAdmin ? '' : `{ ${owningModelVariableName} }`})`
  const omitIndex = singular || !actions.includes('index')
  const omitCreate = !actions.includes('create')
  const omitShow = !actions.includes('show')
  const omitUpdate = !actions.includes('update')
  const omitDestroy = !actions.includes('destroy')

  return `${
    dreamImports.length ? `import { ${uniq(dreamImports).join(', ')} } from '@rvoh/dream'\n` : ''
  }${uniq(importStatements).join('\n')}
import { RequestBody, session, SpecRequestType } from '${specUnitUpdirs}helpers/${addImportSuffix('authentication.js')}'

describe('${fullyQualifiedControllerName}', () => {
  let request: SpecRequestType
  let ${userVariableName}: ${userModelName}${owningModel ? `\n  let ${owningModelVariableName}: ${owningModelName}` : ''}

  beforeEach(async () => {
    ${userVariableName} = await create${userModelName}()${owningModel ? `\n    ${owningModelVariableName} = await create${owningModelName}({ ${userVariableName} })` : ''}
    request = await session(${userVariableName})
  })${
    omitIndex
      ? ''
      : `

  describe('GET index', () => {
    const subject = async <StatusCode extends 200 | 400 | 404>(expectedStatus: StatusCode) => {
      return request.get('/${route}', expectedStatus)
    }

    it('returns the index of ${fullyQualifiedModelName}s', async () => {
      ${simpleCreationCommand}

      const { body } = await subject(200)

      expect(body.results).toEqual([
        expect.objectContaining({
          id: ${modelVariableName}.id,
        }),
      ])
    })${
      singular || forAdmin
        ? ''
        : `

    context('${modelClassName}s created by another ${owningModelName}', () => {
      it('are omitted', async () => {
        await create${modelClassName}()

        const { body } = await subject(200)

        expect(body.results).toEqual([])
      })
    })`
    }
  })`
  }${
    omitShow
      ? ''
      : `

  describe('GET show', () => {${
    singular
      ? `
    const subject = async <StatusCode extends 200 | 400 | 404>(expectedStatus: StatusCode) => {
      return request.get('/${route}', expectedStatus)
    }`
      : `
    const subject = async <StatusCode extends 200 | 400 | 404>(${modelVariableName}: ${modelClassName}, expectedStatus: StatusCode) => {
      return request.get('/${route}/{id}', expectedStatus, {
        id: ${modelVariableName}.id,
      })
    }`
  }

    it('returns the ${singular ? `${fullyQualifiedModelName} belonging to the ${owningModelName}` : `specified ${fullyQualifiedModelName}`}', async () => {
      ${simpleCreationCommand}

      const { body } = await subject(${singular ? '' : `${modelVariableName}, `}200)

      expect(body).toEqual(
        expect.objectContaining({
          id: ${modelVariableName}.id,${comparableOriginalAttributeKeyValues.length ? '\n          ' + comparableOriginalAttributeKeyValues.join('\n          ') : ''}
        }),
      )
    })${
      singular || forAdmin
        ? ''
        : `

    context('${fullyQualifiedModelName} created by another ${owningModelName}', () => {
      it('is not found', async () => {
        const other${owningModelName}${modelClassName} = await create${modelClassName}()

        await subject(other${owningModelName}${modelClassName}, 404)
      })
    })`
    }
  })`
  }${
    omitCreate
      ? ''
      : `

  describe('POST create', () => {
    const subject = async <StatusCode extends 201 | 400 | 404>(
      data: RequestBody<'post', '/${route}'>,
      expectedStatus: StatusCode
    ) => {
      return request.post('/${route}', expectedStatus, { data })
    }

    it('creates a ${fullyQualifiedModelName}${forAdmin ? '' : ` for this ${owningModelName}`}', async () => {${
      dateAttributeIncluded
        ? `
      const today = CalendarDate.today()`
        : ''
    }${
      datetimeAttributeIncluded
        ? `
      const now = DateTime.now()`
        : ''
    }${dateAttributeIncluded || datetimeAttributeIncluded ? '\n' : ''}
      const { body } = await subject({
        ${attributeCreationKeyValues.join('\n        ')}
      }, 201)

      const ${modelVariableName} = await ${
        forAdmin
          ? `${modelClassName}.firstOrFail()`
          : `${owningModelVariableName}.associationQuery('${singular ? modelVariableName : pluralize(modelVariableName)}').firstOrFail()`
      }${expectEqualOriginalValue.length ? '\n      ' + expectEqualOriginalValue.join('\n      ') : ''}

      expect(body).toEqual(
        expect.objectContaining({
          id: ${modelVariableName}.id,${comparableOriginalAttributeKeyValues.length ? '\n          ' + comparableOriginalAttributeKeyValues.join('\n          ') : ''}
        }),
      )
    })
  })`
  }${
    omitUpdate
      ? ''
      : `

  describe('PATCH update', () => {${
    singular
      ? `
    const subject = async <StatusCode extends 204 | 400 | 404>(
      data: RequestBody<'patch', '/${route}'>,
      expectedStatus: StatusCode
    ) => {
      return request.patch('/${route}', expectedStatus, {
        data,
      })
    }`
      : `
    const subject = async <StatusCode extends 204 | 400 | 404>(
      ${modelVariableName}: ${modelClassName},
      data: RequestBody<'patch', '/${route}/{id}'>,
      expectedStatus: StatusCode
    ) => {
      return request.patch('/${route}/{id}', expectedStatus, {
        id: ${modelVariableName}.id,
        data,
      })
    }`
  }

    it('updates the ${fullyQualifiedModelName}', async () => {${
      dateAttributeIncluded
        ? `
      const yesterday = CalendarDate.yesterday()`
        : ''
    }${
      datetimeAttributeIncluded
        ? `
      const lastHour = DateTime.now().minus({ hour: 1 })`
        : ''
    }${dateAttributeIncluded || datetimeAttributeIncluded ? '\n' : ''}
      ${simpleCreationCommand}

      await subject(${singular ? '' : `${modelVariableName}, `}{
        ${attributeUpdateKeyValues.length ? attributeUpdateKeyValues.join('\n        ') : ''}
      }, 204)

      await ${modelVariableName}.reload()
      ${expectEqualUpdatedValue.join('\n      ')}
    })${
      singular || forAdmin
        ? ''
        : `

    context('a ${fullyQualifiedModelName} created by another ${owningModelName}', () => {
      it('is not updated', async () => {${
        dateAttributeIncluded
          ? `
        const yesterday = CalendarDate.yesterday()`
          : ''
      }${
        datetimeAttributeIncluded
          ? `
        const lastHour = DateTime.now().minus({ hour: 1 })`
          : ''
      }${dateAttributeIncluded || datetimeAttributeIncluded ? '\n' : ''}
        const ${modelVariableName} = await create${modelClassName}()
        ${originalValueVariableAssignments.length ? originalValueVariableAssignments.join('\n        ') : ''}

        await subject(${modelVariableName}, {
          ${attributeUpdateKeyValues.length ? attributeUpdateKeyValues.join('\n          ') : ''}
        }, 404)

        await ${modelVariableName}.reload()
        ${expectEqualOriginalNamedVariable.join('\n        ')}
      })
    })`
    }
  })`
  }${
    omitDestroy
      ? ''
      : `

  describe('DELETE destroy', () => {${
    singular
      ? `
    const subject = async <StatusCode extends 204 | 400 | 404>(expectedStatus: StatusCode) => {
      return request.delete('/${route}', expectedStatus)
    }`
      : `
    const subject = async <StatusCode extends 204 | 400 | 404>(${modelVariableName}: ${modelClassName}, expectedStatus: StatusCode) => {
      return request.delete('/${route}/{id}', expectedStatus, {
        id: ${modelVariableName}.id,
      })
    }`
  }

    it('deletes the ${fullyQualifiedModelName}', async () => {
      ${simpleCreationCommand}

      await subject(${singular ? '' : `${modelVariableName}, `}204)

      expect(await ${modelClassName}.find(${modelVariableName}.id)).toBeNull()
    })${
      singular || forAdmin
        ? ''
        : `

    context('a ${fullyQualifiedModelName} created by another ${owningModelName}', () => {
      it('is not deleted', async () => {
        const ${modelVariableName} = await create${modelClassName}()

        await subject(${modelVariableName}, 404)

        expect(await ${modelClassName}.find(${modelVariableName}.id)).toMatchDreamModel(${modelVariableName})
      })
    })`
    }
  })`
  }
})
`
}

function importStatementForModel(originModelName: string, destinationModelName: string = originModelName) {
  return `import ${globalClassNameFromFullyQualifiedModelName(destinationModelName)} from '${relativePsychicPath('controllerSpecs', 'models', originModelName, destinationModelName)}'`
}

function importStatementForModelFactory(
  originModelName: string,
  destinationModelName: string = originModelName,
) {
  return `import create${globalClassNameFromFullyQualifiedModelName(destinationModelName)} from '${relativePsychicPath('controllerSpecs', 'factories', originModelName, destinationModelName)}'`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function jsonify(val: any) {
  return JSON.stringify(val).replace(/"/g, "'")
}
