import {
  camelize,
  globalClassNameFromFullyQualifiedModelName,
  standardizeFullyQualifiedModelName,
  uniq,
} from '@rvohealth/dream'
import relativePsychicPath from '../../helpers/path/relativePsychicPath'
import updirsFromPath from '../../helpers/path/updirsFromPath'

export default function generateResourceControllerSpecContent({
  fullyQualifiedControllerName,
  route,
  fullyQualifiedModelName,
  columnsWithTypes,
}: {
  fullyQualifiedControllerName: string
  route: string
  fullyQualifiedModelName: string
  columnsWithTypes: string[]
}) {
  fullyQualifiedModelName = standardizeFullyQualifiedModelName(fullyQualifiedModelName)
  const modelClassName = globalClassNameFromFullyQualifiedModelName(fullyQualifiedModelName)
  const modelVariableName = camelize(modelClassName)

  const importStatements: string[] = [
    importStatementForModel(fullyQualifiedControllerName, fullyQualifiedModelName),
    importStatementForModel(fullyQualifiedControllerName, 'User'),
    importStatementForModelFactory(fullyQualifiedControllerName, fullyQualifiedModelName),
    importStatementForModelFactory(fullyQualifiedControllerName, 'User'),
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
import { UpdateableProperties } from '@rvohealth/dream'
import { PsychicServer } from '@rvohealth/psychic'
import { specRequest as request } from '@rvohealth/psychic-spec-helpers'${uniq(importStatements).join('')}
import { addEndUserAuthHeader } from '${specUnitUpdirs}helpers/authentication'

describe('${fullyQualifiedControllerName}', () => {
  let user: User

  beforeEach(async () => {
    await request.init(PsychicServer)
    user = await createUser()
  })

  describe('GET index', () => {
    function subject(expectedStatus: number = 200) {
      return request.get('/${route}', expectedStatus, {
        headers: addEndUserAuthHeader(request, user, {}),
      })
    }

    it('returns the index of ${fullyQualifiedModelName}s', async () => {
      const ${modelVariableName} = await create${modelClassName}({
        user${originalStringKeyValues.length ? ',\n        ' + originalStringKeyValues.join(',\n        ') : ''}
      })
      const results = (await subject()).body

      expect(results).toEqual([
        expect.objectContaining({
          id: ${modelVariableName}.id,
        }),
      ])
    })

    context('${modelClassName}s created by another User', () => {
      it('are omitted', async () => {
        await create${modelClassName}()
        const results = (await subject()).body

        expect(results).toEqual([])
      })
    })
  })

  describe('GET show', () => {
    function subject(${modelVariableName}: ${modelClassName}, expectedStatus: number = 200) {
      return request.get(\`/${route}/\${${modelVariableName}.id}\`, expectedStatus, {
        headers: addEndUserAuthHeader(request, user, {}),
      })
    }

    it('returns the specified ${fullyQualifiedModelName}', async () => {
      const ${modelVariableName} = await create${modelClassName}({
        user${originalStringKeyValues.length ? ',\n        ' + originalStringKeyValues.join(',\n        ') : ''}
      })
      const results = (await subject(${modelVariableName})).body

      expect(results).toEqual(
        expect.objectContaining({
          id: ${modelVariableName}.id,${originalStringKeyValues.length ? '\n          ' + originalStringKeyValues.join('\n          ') : ''}
        }),
      )
    })

    context('${fullyQualifiedModelName} created by another User', () => {
      it('is not found', async () => {
        const otherUser${modelClassName} = await create${modelClassName}()
        await subject(otherUser${modelClassName}, 404)
      })
    })
  })

  describe('POST create', () => {
    function subject(data: UpdateableProperties<${modelClassName}>, expectedStatus: number = 201) {
      return request.post('/${route}', expectedStatus, {
        data,
        headers: addEndUserAuthHeader(request, user, {}),
      })
    }

    it('creates a ${fullyQualifiedModelName} for this User', async () => {
      const results = (await subject({
        ${originalStringKeyValues.length ? originalStringKeyValues.join(',\n        ') : ''}
      })).body
      const ${modelVariableName} = await ${modelClassName}.findOrFailBy({ userId: user.id })

      expect(results).toEqual(
        expect.objectContaining({
          id: ${modelVariableName}.id,${originalStringKeyValues.length ? '\n          ' + originalStringKeyValues.join('\n          ') : ''}
        }),
      )
    })
  })

  describe('PATCH update', () => {
    function subject(${modelVariableName}: ${modelClassName}, data: UpdateableProperties<${modelClassName}>, expectedStatus: number = 204) {
      return request.patch(\`/${route}/\${${modelVariableName}.id}\`, expectedStatus, {
        data,
        headers: addEndUserAuthHeader(request, user, {}),
      })
    }

    it('updates the ${fullyQualifiedModelName}', async () => {
      const ${modelVariableName} = await create${modelClassName}({
        user${originalStringKeyValues.length ? ',\n        ' + originalStringKeyValues.join(',\n        ') : ''}
      })
      await subject(${modelVariableName}, {
        ${updatedStringKeyValues.length ? updatedStringKeyValues.join(',\n        ') : ''}
      })

      await ${modelVariableName}.reload()
      ${updatedStringAttributeChecks.join('\n      ')}
    })

    context('a ${fullyQualifiedModelName} created by another User', () => {
      it('is not updated', async () => {
        const ${modelVariableName} = await create${modelClassName}({
          ${originalStringKeyValues.length ? originalStringKeyValues.join(',\n          ') : ''}
        })
        await subject(${modelVariableName}, {
          ${updatedStringKeyValues.length ? updatedStringKeyValues.join(',\n          ') : ''}
        }, 404)

        await ${modelVariableName}.reload()
        ${originalStringAttributeChecks.join('\n        ')}
      })
    })
  })

  describe('DELETE destroy', () => {
    function subject(${modelVariableName}: ${modelClassName}, expectedStatus: number = 204) {
      return request.delete(\`/${route}/\${${modelVariableName}.id}\`, expectedStatus, {
        headers: addEndUserAuthHeader(request, user, {}),
      })
    }

    it('deletes the ${fullyQualifiedModelName}', async () => {
      const ${modelVariableName} = await create${modelClassName}({ user })
      await subject(${modelVariableName})

      expect(await ${modelClassName}.find(${modelVariableName}.id)).toBeNull()
    })

    context('a ${fullyQualifiedModelName} created by another User', () => {
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
