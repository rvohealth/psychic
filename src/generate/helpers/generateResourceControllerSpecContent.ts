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

export default function generateResourceControllerSpecContent({
  fullyQualifiedControllerName,
  route,
  fullyQualifiedModelName,
  columnsWithTypes,
  owningModel,
  forAdmin,
}: {
  fullyQualifiedControllerName: string
  route: string
  fullyQualifiedModelName: string
  columnsWithTypes: string[]
  owningModel?: string | undefined
  forAdmin: boolean
}) {
  fullyQualifiedModelName = standardizeFullyQualifiedModelName(fullyQualifiedModelName)
  const modelClassName = globalClassNameFromFullyQualifiedModelName(fullyQualifiedModelName)
  const modelVariableName = camelize(modelClassName)

  // Always use User for authentication
  const userModelClassName = forAdmin ? 'AdminUser' : 'User'
  const userVariableName = forAdmin ? 'adminUser' : 'user'

  // Determine attached model settings if provided
  const owningModelClassName = owningModel
    ? globalClassNameFromFullyQualifiedModelName(owningModel)
    : userModelClassName
  const owningModelVariableName = owningModelClassName ? camelize(owningModelClassName) : userVariableName

  const importStatements: string[] = compact([
    importStatementForModel(fullyQualifiedControllerName, fullyQualifiedModelName),
    importStatementForModel(fullyQualifiedControllerName, userModelClassName),
    owningModel ? importStatementForModel(fullyQualifiedControllerName, owningModel) : undefined,
    importStatementForModelFactory(fullyQualifiedControllerName, fullyQualifiedModelName),
    importStatementForModelFactory(fullyQualifiedControllerName, userModelClassName),
    owningModel ? importStatementForModelFactory(fullyQualifiedControllerName, owningModel) : undefined,
  ])

  const specUnitUpdirs = updirsFromPath(fullyQualifiedControllerName)
  const attributeCreationKeyValues: string[] = []
  const attributeUpdateKeyValues: string[] = []
  const originalValueAttributeChecks: string[] = []
  const updatedValueAttributeChecks: string[] = []
  const nonUpdatedValueAttributeChecks: string[] = []
  const originalValueVariableAssignments: string[] = []
  const keyWithDotValue: string[] = []

  for (const attribute of columnsWithTypes) {
    const [rawAttributeName, attributeType, , enumValues] = attribute.split(':')
    if (rawAttributeName === 'type') continue
    if (/(_type|_id)$/.test(rawAttributeName ?? '')) continue
    const attributeName = camelize(rawAttributeName ?? '')
    const originalName = `The ${fullyQualifiedModelName} ${attributeName}`
    const updatedName = `Updated ${fullyQualifiedModelName} ${attributeName}`
    const dotNotationVariable = `${modelVariableName}.${attributeName}`

    switch (attributeType) {
      case 'enum': {
        if (attribute === 'type') continue

        const originalEnumValue = (enumValues ?? '').split(',').at(0)!
        const updatedEnumValue = (enumValues ?? '').split(',').at(-1)!

        attributeCreationKeyValues.push(`${attributeName}: '${originalEnumValue}',`)
        attributeUpdateKeyValues.push(`${attributeName}: '${updatedEnumValue}',`)

        originalValueAttributeChecks.push(`expect(${dotNotationVariable}).toEqual('${originalEnumValue}')`)
        updatedValueAttributeChecks.push(`expect(${dotNotationVariable}).toEqual('${updatedEnumValue}')`)

        break
      }

      case 'string':
      case 'text':
      case 'citext':
        attributeCreationKeyValues.push(`${attributeName}: '${originalName}',`)
        attributeUpdateKeyValues.push(`${attributeName}: '${updatedName}',`)

        originalValueAttributeChecks.push(`expect(${dotNotationVariable}).toEqual('${originalName}')`)
        updatedValueAttributeChecks.push(`expect(${dotNotationVariable}).toEqual('${updatedName}')`)
        break

      case 'integer':
        attributeCreationKeyValues.push(`${attributeName}: 1,`)
        attributeUpdateKeyValues.push(`${attributeName}: 2,`)

        originalValueAttributeChecks.push(`expect(${dotNotationVariable}).toEqual(1)`)
        updatedValueAttributeChecks.push(`expect(${dotNotationVariable}).toEqual(2)`)

        break

      case 'bigint':
        attributeCreationKeyValues.push(`${attributeName}: '11111111111111111',`)
        attributeUpdateKeyValues.push(`${attributeName}: '22222222222222222',`)

        originalValueAttributeChecks.push(`expect(${dotNotationVariable}).toEqual('11111111111111111')`)
        updatedValueAttributeChecks.push(`expect(${dotNotationVariable}).toEqual('22222222222222222')`)

        break

      case 'decimal':
        attributeCreationKeyValues.push(`${attributeName}: 1.1,`)
        attributeUpdateKeyValues.push(`${attributeName}: 2.2,`)

        originalValueAttributeChecks.push(`expect(${dotNotationVariable}).toEqual(1.1)`)
        updatedValueAttributeChecks.push(`expect(${dotNotationVariable}).toEqual(2.2)`)
        break

      default:
        continue
    }

    keyWithDotValue.push(`${attributeName}: ${dotNotationVariable},`)
    const originalAttributeVariableName = 'original' + capitalize(attributeName)
    originalValueVariableAssignments.push(`const ${originalAttributeVariableName} = ${dotNotationVariable}`)
    nonUpdatedValueAttributeChecks.push(
      `expect(${dotNotationVariable}).toEqual(${originalAttributeVariableName})`,
    )
  }

  const simpleCreationCommand = `const ${modelVariableName} = await create${modelClassName}(${forAdmin ? '' : `{ ${owningModelVariableName} }`})`
  const dotValueAttributes = keyWithDotValue.length
    ? '\n          ' + keyWithDotValue.join('\n          ')
    : ''

  return `\
import { UpdateableProperties } from '@rvoh/dream'${uniq(importStatements).join('')}
import { session, SpecRequestType } from '${specUnitUpdirs}helpers/authentication.js'

describe('${fullyQualifiedControllerName}', () => {
  let request: SpecRequestType
  let ${userVariableName}: ${userModelClassName}${owningModel ? `\n  let ${owningModelVariableName}: ${owningModelClassName}` : ''}

  beforeEach(async () => {
    ${userVariableName} = await create${userModelClassName}()${owningModel ? `\n    ${owningModelVariableName} = await create${owningModelClassName}({ ${userVariableName} })` : ''}
    request = await session(${userVariableName})
  })

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
      forAdmin
        ? ''
        : `

    context('${modelClassName}s created by another ${owningModelClassName}', () => {
      it('are omitted', async () => {
        await create${modelClassName}()

        const { body } = await subject(200)

        expect(body).toEqual([])
      })
    })`
    }
  })

  describe('GET show', () => {
    const subject = async <StatusCode extends 200 | 400 | 404>(${modelVariableName}: ${modelClassName}, expectedStatus: StatusCode) => {
      return request.get('/${route}/{id}', expectedStatus, {
        id: ${modelVariableName}.id,
      })
    }

    it('returns the specified ${fullyQualifiedModelName}', async () => {
      ${simpleCreationCommand}

      const { body } = await subject(${modelVariableName}, 200)

      expect(body).toEqual(
        expect.objectContaining({
          id: ${modelVariableName}.id,${dotValueAttributes}
        }),
      )
    })${
      forAdmin
        ? ''
        : `

    context('${fullyQualifiedModelName} created by another ${owningModelClassName}', () => {
      it('is not found', async () => {
        const other${owningModelClassName}${modelClassName} = await create${modelClassName}()

        await subject(other${owningModelClassName}${modelClassName}, 404)
      })
    })`
    }
  })

  describe('POST create', () => {
    const subject = async <StatusCode extends 201 | 400>(
      data: UpdateableProperties<${modelClassName}>,
      expectedStatus: StatusCode
    ) => {
      return request.post('/${route}', expectedStatus, { data })
    }

    it('creates a ${fullyQualifiedModelName}${forAdmin ? '' : ` for this ${owningModelClassName}`}', async () => {
      const { body } = await subject({
        ${attributeCreationKeyValues.join('\n        ')}
      }, 201)

      const ${modelVariableName} = await ${
        forAdmin
          ? `${modelClassName}.firstOrFail()`
          : `${owningModelVariableName}.associationQuery('${pluralize(modelVariableName)}').firstOrFail()`
      }

      expect(body).toEqual(
        expect.objectContaining({
          id: ${modelVariableName}.id,${attributeCreationKeyValues.length ? '\n          ' + attributeCreationKeyValues.join('\n          ') : ''}
        }),
      )
    })
  })

  describe('PATCH update', () => {
    const subject = async <StatusCode extends 204 | 400 | 404>(
      ${modelVariableName}: ${modelClassName},
      data: UpdateableProperties<${modelClassName}>,
      expectedStatus: StatusCode
    ) => {
      return request.patch('/${route}/{id}', expectedStatus, {
        id: ${modelVariableName}.id,
        data,
      })
    }

    it('updates the ${fullyQualifiedModelName}', async () => {
      ${simpleCreationCommand}

      await subject(${modelVariableName}, {
        ${attributeUpdateKeyValues.length ? attributeUpdateKeyValues.join('\n        ') : ''}
      }, 204)

      await ${modelVariableName}.reload()
      ${updatedValueAttributeChecks.join('\n      ')}
    })${
      forAdmin
        ? ''
        : `

    context('a ${fullyQualifiedModelName} created by another ${owningModelClassName}', () => {
      it('is not updated', async () => {
        const ${modelVariableName} = await create${modelClassName}()
        ${originalValueVariableAssignments.length ? originalValueVariableAssignments.join('\n        ') : ''}

        await subject(${modelVariableName}, {
          ${attributeUpdateKeyValues.length ? attributeUpdateKeyValues.join('\n          ') : ''}
        }, 404)

        await ${modelVariableName}.reload()
        ${nonUpdatedValueAttributeChecks.join('\n        ')}
      })
    })`
    }
  })

  describe('DELETE destroy', () => {
    const subject = async <StatusCode extends 204 | 400 | 404>(${modelVariableName}: ${modelClassName}, expectedStatus: StatusCode) => {
      return request.delete('/${route}/{id}', expectedStatus, {
        id: ${modelVariableName}.id,
      })
    }

    it('deletes the ${fullyQualifiedModelName}', async () => {
      ${simpleCreationCommand}

      await subject(${modelVariableName}, 204)

      expect(await ${modelClassName}.find(${modelVariableName}.id)).toBeNull()
    })${
      forAdmin
        ? ''
        : `

    context('a ${fullyQualifiedModelName} created by another ${owningModelClassName}', () => {
      it('is not deleted', async () => {
        const ${modelVariableName} = await create${modelClassName}()

        await subject(${modelVariableName}, 404)

        expect(await ${modelClassName}.find(${modelVariableName}.id)).toMatchDreamModel(${modelVariableName})
      })
    })`
    }
  })
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
