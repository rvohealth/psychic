import {
  camelize,
  globalClassNameFromFullyQualifiedModelName,
  standardizeFullyQualifiedModelName,
  uniq,
} from '@rvoh/dream'
import relativePsychicPath from '../../helpers/path/relativePsychicPath.js'
import updirsFromPath from '../../helpers/path/updirsFromPath.js'

export default function generateResourceControllerSpecContent({
  fullyQualifiedControllerName,
  route,
  fullyQualifiedModelName,
  columnsWithTypes,
  userModel,
}: {
  fullyQualifiedControllerName: string
  route: string
  fullyQualifiedModelName: string
  columnsWithTypes: string[]
  userModel?: string | undefined
}) {
  fullyQualifiedModelName = standardizeFullyQualifiedModelName(fullyQualifiedModelName)
  const modelClassName = globalClassNameFromFullyQualifiedModelName(fullyQualifiedModelName)
  const modelVariableName = camelize(modelClassName)

  // Determine user model settings
  const actualUserModel = userModel || 'User'
  const userModelClassName = globalClassNameFromFullyQualifiedModelName(actualUserModel)
  const userVariableName = camelize(userModelClassName)
  const currentUserProperty = `current${userModelClassName}`

  const importStatements: string[] = [
    importStatementForModel(fullyQualifiedControllerName, fullyQualifiedModelName),
    importStatementForModel(fullyQualifiedControllerName, actualUserModel),
    importStatementForModelFactory(fullyQualifiedControllerName, fullyQualifiedModelName),
    importStatementForModelFactory(fullyQualifiedControllerName, actualUserModel),
  ]

  const specUnitUpdirs = updirsFromPath(fullyQualifiedControllerName)
  const originalStringKeyValues: string[] = []
  const updatedStringKeyValues: string[] = []
  const originalStringAttributeChecks: string[] = []
  const updatedStringAttributeChecks: string[] = []

  for (const attribute of columnsWithTypes) {
    const [attributeName, attributeType] = attribute.split(':')
    const originalName = `The ${fullyQualifiedModelName} ${attributeName}`
    const updatedName = `Updated ${fullyQualifiedModelName} ${attributeName}`

    switch (attributeType) {
      case 'string':
      case 'text':
        originalStringKeyValues.push(`${attributeName}: '${originalName}',`)
        updatedStringKeyValues.push(`${attributeName}: '${updatedName}',`)
        originalStringAttributeChecks.push(
          `expect(${modelVariableName}.${attributeName}).toEqual('${originalName}')`,
        )
        updatedStringAttributeChecks.push(
          `expect(${modelVariableName}.${attributeName}).toEqual('${updatedName}')`,
        )
        break

      default:
      // noop
    }
  }

  return `\
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { UpdateableProperties } from '@rvoh/dream'
import { PsychicServer } from '@rvoh/psychic'
import { specRequest as request } from '@rvoh/psychic-spec-helpers'${uniq(importStatements).join('')}
import addEndUserAuthHeader from '${specUnitUpdirs}helpers/authentication.js'

describe('${fullyQualifiedControllerName}', () => {
  let ${userVariableName}: ${userModelClassName}

  beforeEach(async () => {
    await request.init(PsychicServer)
    ${userVariableName} = await create${userModelClassName}()
  })

  describe('GET index', () => {
    const subject = async (expectedStatus: number = 200) => {
      return request.get('/${route}', expectedStatus, {
        headers: await addEndUserAuthHeader(request, ${userVariableName}, {}),
      })
    }

    it('returns the index of ${fullyQualifiedModelName}s', async () => {
      const ${modelVariableName} = await create${modelClassName}({
        ${userVariableName}${originalStringKeyValues.length ? ',\n        ' + originalStringKeyValues.join('\n        ') : ''}
      })
      const results = (await subject()).body

      expect(results).toEqual([
        expect.objectContaining({
          id: ${modelVariableName}.id,
        }),
      ])
    })

    context('${modelClassName}s created by another ${userModelClassName}', () => {
      it('are omitted', async () => {
        await create${modelClassName}()
        const results = (await subject()).body

        expect(results).toEqual([])
      })
    })
  })

  describe('GET show', () => {
    const subject = async (${modelVariableName}: ${modelClassName}, expectedStatus: number = 200) => {
      return request.get(\`/${route}/\${${modelVariableName}.id}\`, expectedStatus, {
        headers: await addEndUserAuthHeader(request, ${userVariableName}, {}),
      })
    }

    it('returns the specified ${fullyQualifiedModelName}', async () => {
      const ${modelVariableName} = await create${modelClassName}({
        ${userVariableName}${originalStringKeyValues.length ? ',\n        ' + originalStringKeyValues.join('\n        ') : ''}
      })
      const results = (await subject(${modelVariableName})).body

      expect(results).toEqual(
        expect.objectContaining({
          id: ${modelVariableName}.id,${originalStringKeyValues.length ? '\n          ' + originalStringKeyValues.join('\n          ') : ''}
        }),
      )
    })

    context('${fullyQualifiedModelName} created by another ${userModelClassName}', () => {
      it('is not found', async () => {
        const other${userModelClassName}${modelClassName} = await create${modelClassName}()
        await subject(other${userModelClassName}${modelClassName}, 404)
      })
    })
  })

  describe('POST create', () => {
    const subject = async (data: UpdateableProperties<${modelClassName}>, expectedStatus: number = 201) => {
      return request.post('/${route}', expectedStatus, {
        data,
        headers: await addEndUserAuthHeader(request, ${userVariableName}, {}),
      })
    }

    it('creates a ${fullyQualifiedModelName} for this ${userModelClassName}', async () => {
      const results = (await subject({
        ${originalStringKeyValues.length ? originalStringKeyValues.join('\n        ') : ''}
      })).body
      const ${modelVariableName} = await ${modelClassName}.findOrFailBy({ ${userVariableName}Id: ${userVariableName}.id })

      expect(results).toEqual(
        expect.objectContaining({
          id: ${modelVariableName}.id,${originalStringKeyValues.length ? '\n          ' + originalStringKeyValues.join('\n          ') : ''}
        }),
      )
    })
  })

  describe('PATCH update', () => {
    const subject = async (${modelVariableName}: ${modelClassName}, data: UpdateableProperties<${modelClassName}>, expectedStatus: number = 204) => {
      return request.patch(\`/${route}/\${${modelVariableName}.id}\`, expectedStatus, {
        data,
        headers: await addEndUserAuthHeader(request, ${userVariableName}, {}),
      })
    }

    it('updates the ${fullyQualifiedModelName}', async () => {
      const ${modelVariableName} = await create${modelClassName}({
        ${userVariableName}${originalStringKeyValues.length ? ',\n        ' + originalStringKeyValues.join('\n        ') : ''}
      })
      await subject(${modelVariableName}, {
        ${updatedStringKeyValues.length ? updatedStringKeyValues.join('\n        ') : ''}
      })

      await ${modelVariableName}.reload()
      ${updatedStringAttributeChecks.join('\n      ')}
    })

    context('a ${fullyQualifiedModelName} created by another ${userModelClassName}', () => {
      it('is not updated', async () => {
        const ${modelVariableName} = await create${modelClassName}({
          ${originalStringKeyValues.length ? originalStringKeyValues.join('\n          ') : ''}
        })
        await subject(${modelVariableName}, {
          ${updatedStringKeyValues.length ? updatedStringKeyValues.join('\n          ') : ''}
        }, 404)

        await ${modelVariableName}.reload()
        ${originalStringAttributeChecks.join('\n        ')}
      })
    })
  })

  describe('DELETE destroy', () => {
    const subject = async (${modelVariableName}: ${modelClassName}, expectedStatus: number = 204) => {
      return request.delete(\`/${route}/\${${modelVariableName}.id}\`, expectedStatus, {
        headers: await addEndUserAuthHeader(request, ${userVariableName}, {}),
      })
    }

    it('deletes the ${fullyQualifiedModelName}', async () => {
      const ${modelVariableName} = await create${modelClassName}({ ${userVariableName} })
      await subject(${modelVariableName})

      expect(await ${modelClassName}.find(${modelVariableName}.id)).toBeNull()
    })

    context('a ${fullyQualifiedModelName} created by another ${userModelClassName}', () => {
      it('is not deleted', async () => {
        const ${modelVariableName} = await create${modelClassName}()
        await subject(${modelVariableName}, 404)

        expect(await ${modelClassName}.find(${modelVariableName}.id)).toMatchDreamModel(${modelVariableName})
      })
    })
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
