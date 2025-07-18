import {
  camelize,
  capitalize,
  compact,
  globalClassNameFromFullyQualifiedModelName,
  standardizeFullyQualifiedModelName,
  uniq,
} from '@rvoh/dream'
import relativePsychicPath from '../../helpers/path/relativePsychicPath.js'
import updirsFromPath from '../../helpers/path/updirsFromPath.js'
import { pluralize } from '../../index.js'
import addImportSuffix from '../../helpers/path/addImportSuffix.js'

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

  const dreamImports: string[] = ['UpdateableProperties']

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
  const comparableUpdatedAttributeKeyValues: string[] = []

  const expectEqualOriginalValue: string[] = []
  const expectEqualUpdatedValue: string[] = []

  const expectEqualOriginalNamedVariable: string[] = []

  const originalValueVariableAssignments: string[] = []
  const keyWithDotValue: string[] = []

  let dateAttributeIncluded: boolean = false
  let datetimeAttributeIncluded: boolean = false

  for (const attribute of columnsWithTypes) {
    const [rawAttributeName, attributeType, , enumValues] = attribute.split(':')
    if (/(_type|_id)$/.test(rawAttributeName ?? '')) continue
    const attributeName = camelize(rawAttributeName ?? '')
    const dotNotationVariable = `${modelVariableName}.${attributeName}`

    if (attributeName === 'deletedAt') continue

    switch (attributeType) {
      case 'enum': {
        const originalEnumValue = (enumValues ?? '').split(',').at(0)!
        const updatedEnumValue = (enumValues ?? '').split(',').at(-1)!

        attributeCreationKeyValues.push(`${attributeName}: '${originalEnumValue}',`)
        attributeUpdateKeyValues.push(`${attributeName}: '${updatedEnumValue}',`)

        comparableOriginalAttributeKeyValues.push(`${attributeName}: ${dotNotationVariable},`)
        comparableUpdatedAttributeKeyValues.push(`${attributeName}: '${updatedEnumValue}',`)

        expectEqualOriginalValue.push(`expect(${dotNotationVariable}).toEqual('${originalEnumValue}')`)
        expectEqualUpdatedValue.push(`expect(${dotNotationVariable}).toEqual('${updatedEnumValue}')`)

        break
      }

      case 'string':
      case 'text':
      case 'citext': {
        const originalStringValue = `The ${fullyQualifiedModelName} ${attributeName}`
        const updatedStringValue = `Updated ${fullyQualifiedModelName} ${attributeName}`

        attributeCreationKeyValues.push(`${attributeName}: '${originalStringValue}',`)
        attributeUpdateKeyValues.push(`${attributeName}: '${updatedStringValue}',`)

        comparableOriginalAttributeKeyValues.push(`${attributeName}: ${dotNotationVariable},`)
        comparableUpdatedAttributeKeyValues.push(`${attributeName}: '${updatedStringValue}',`)

        expectEqualOriginalValue.push(`expect(${dotNotationVariable}).toEqual('${originalStringValue}')`)
        expectEqualUpdatedValue.push(`expect(${dotNotationVariable}).toEqual('${updatedStringValue}')`)
        break
      }

      case 'integer':
        attributeCreationKeyValues.push(`${attributeName}: 1,`)
        attributeUpdateKeyValues.push(`${attributeName}: 2,`)

        comparableOriginalAttributeKeyValues.push(`${attributeName}: ${dotNotationVariable},`)
        comparableUpdatedAttributeKeyValues.push(`${attributeName}: 2,`)

        expectEqualOriginalValue.push(`expect(${dotNotationVariable}).toEqual(1)`)
        expectEqualUpdatedValue.push(`expect(${dotNotationVariable}).toEqual(2)`)

        break

      case 'bigint':
        attributeCreationKeyValues.push(`${attributeName}: '11111111111111111',`)
        attributeUpdateKeyValues.push(`${attributeName}: '22222222222222222',`)

        comparableOriginalAttributeKeyValues.push(`${attributeName}: ${dotNotationVariable},`)
        comparableUpdatedAttributeKeyValues.push(`${attributeName}: '22222222222222222',`)

        expectEqualOriginalValue.push(`expect(${dotNotationVariable}).toEqual('11111111111111111')`)
        expectEqualUpdatedValue.push(`expect(${dotNotationVariable}).toEqual('22222222222222222')`)

        break

      case 'decimal':
        attributeCreationKeyValues.push(`${attributeName}: 1.1,`)
        attributeUpdateKeyValues.push(`${attributeName}: 2.2,`)

        comparableOriginalAttributeKeyValues.push(`${attributeName}: ${dotNotationVariable},`)
        comparableUpdatedAttributeKeyValues.push(`${attributeName}: 2.2,`)

        expectEqualOriginalValue.push(`expect(${dotNotationVariable}).toEqual(1.1)`)
        expectEqualUpdatedValue.push(`expect(${dotNotationVariable}).toEqual(2.2)`)
        break

      case 'date':
        dreamImports.push('CalendarDate')
        dateAttributeIncluded = true
        attributeCreationKeyValues.push(`${attributeName}: today,`)
        attributeUpdateKeyValues.push(`${attributeName}: yesterday,`)

        comparableOriginalAttributeKeyValues.push(`${attributeName}: ${dotNotationVariable}.toISO(),`)
        comparableUpdatedAttributeKeyValues.push(`${attributeName}: yesterday.toISO(),`)

        expectEqualOriginalValue.push(`expect(${dotNotationVariable}).toEqualCalendarDate(today)`)
        expectEqualUpdatedValue.push(`expect(${dotNotationVariable}).toEqualCalendarDate(yesterday)`)
        break

      case 'datetime':
        dreamImports.push('DateTime')
        datetimeAttributeIncluded = true
        attributeCreationKeyValues.push(`${attributeName}: now,`)
        attributeUpdateKeyValues.push(`${attributeName}: lastHour,`)

        comparableOriginalAttributeKeyValues.push(`${attributeName}: ${dotNotationVariable}.toISO(),`)
        comparableUpdatedAttributeKeyValues.push(`${attributeName}: lastHour.toISO(),`)

        expectEqualOriginalValue.push(`expect(${dotNotationVariable}).toEqualDateTime(now)`)
        expectEqualUpdatedValue.push(`expect(${dotNotationVariable}).toEqualDateTime(lastHour)`)
        break

      default:
        continue
    }

    keyWithDotValue.push(`${attributeName}: ${dotNotationVariable},`)
    const originalAttributeVariableName = 'original' + capitalize(attributeName)
    originalValueVariableAssignments.push(`const ${originalAttributeVariableName} = ${dotNotationVariable}`)
    expectEqualOriginalNamedVariable.push(
      `expect(${dotNotationVariable}).toEqual(${originalAttributeVariableName})`,
    )
  }

  const simpleCreationCommand = `const ${modelVariableName} = await create${modelClassName}(${forAdmin ? '' : `{ ${owningModelVariableName} }`})`
  const omitIndex = singular || !actions.includes('index')
  const omitCreate = !actions.includes('create')
  const omitShow = !actions.includes('show')
  const omitUpdate = !actions.includes('update')
  const omitDestroy = !actions.includes('destroy')

  return `\
import { ${uniq(dreamImports).join(', ')} } from '@rvoh/dream'${uniq(importStatements).join('')}
import { session, SpecRequestType } from '${specUnitUpdirs}helpers/${addImportSuffix('authentication.js')}'

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
    const subject = async <StatusCode extends 200 | 400>(expectedStatus: StatusCode) => {
      return request.get('/${route}', expectedStatus)
    }

    it('returns the index of ${fullyQualifiedModelName}s', async () => {
      ${simpleCreationCommand}

      const { body } = await subject(200)

      expect(body).toEqual([
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

        expect(body).toEqual([])
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
    const subject = async <StatusCode extends 201 | 400>(
      data: UpdateableProperties<${modelClassName}>,
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
      data: UpdateableProperties<${modelClassName}>,
      expectedStatus: StatusCode
    ) => {
      return request.patch('/${route}', expectedStatus, {
        data,
      })
    }`
      : `
    const subject = async <StatusCode extends 204 | 400 | 404>(
      ${modelVariableName}: ${modelClassName},
      data: UpdateableProperties<${modelClassName}>,
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
      it('is not updated', async () => {
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
  return `\nimport ${globalClassNameFromFullyQualifiedModelName(destinationModelName)} from '${relativePsychicPath('controllerSpecs', 'models', originModelName, destinationModelName)}'`
}

function importStatementForModelFactory(
  originModelName: string,
  destinationModelName: string = originModelName,
) {
  return `\nimport create${globalClassNameFromFullyQualifiedModelName(destinationModelName)} from '${relativePsychicPath('controllerSpecs', 'factories', originModelName, destinationModelName)}'`
}
