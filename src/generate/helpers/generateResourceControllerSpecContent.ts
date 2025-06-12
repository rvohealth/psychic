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
  owningModel,
}: {
  fullyQualifiedControllerName: string
  route: string
  fullyQualifiedModelName: string
  columnsWithTypes: string[]
  owningModel?: string | undefined
}) {
  fullyQualifiedModelName = standardizeFullyQualifiedModelName(fullyQualifiedModelName)
  const modelClassName = globalClassNameFromFullyQualifiedModelName(fullyQualifiedModelName)
  const modelVariableName = camelize(modelClassName)

  // Always use User for authentication
  const owningModelClassName = 'User'
  const userVariableName = 'user'

  // Determine attached model settings if provided
  const attachedModelClassName = owningModel ? globalClassNameFromFullyQualifiedModelName(owningModel) : null
  const attachedModelVariableName = attachedModelClassName ? camelize(attachedModelClassName) : null

  const importStatements: string[] = [
    importStatementForModel(fullyQualifiedControllerName, fullyQualifiedModelName),
    importStatementForModel(fullyQualifiedControllerName, 'User'),
    importStatementForType('openapi/validation.openapi', 'validationOpenapiPaths'),
    importStatementForModelFactory(fullyQualifiedControllerName, fullyQualifiedModelName),
    importStatementForModelFactory(fullyQualifiedControllerName, 'User'),
  ]

  // Add attached model imports if specified
  if (owningModel) {
    importStatements.push(
      importStatementForModel(fullyQualifiedControllerName, owningModel),
      importStatementForModelFactory(fullyQualifiedControllerName, owningModel),
    )
  }

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
import { UpdateableProperties } from '@rvoh/dream'
import { PsychicServer } from '@rvoh/psychic'
import { OpenapiSpecRequest } from '@rvoh/psychic-spec-helpers'${uniq(importStatements).join('')}
import addEndUserAuthHeader from '${specUnitUpdirs}helpers/authentication.js'

const request = new OpenapiSpecRequest<validationOpenapiPaths>()

describe('${fullyQualifiedControllerName}', () => {
  let ${userVariableName}: ${owningModelClassName}${attachedModelVariableName ? `\n  let ${attachedModelVariableName}: ${attachedModelClassName}` : ''}

  beforeEach(async () => {
    await request.init(PsychicServer)
    ${userVariableName} = await createUser()${attachedModelVariableName ? `\n    ${attachedModelVariableName} = await create${attachedModelClassName}({ ${userVariableName} })` : ''}
  })

  describe('GET index', () => {
    const subject = async <StatusCode extends 200 | 400>(expectedStatus: StatusCode) => {
      return request.get('/${route}', expectedStatus, {
        headers: await addEndUserAuthHeader(request, ${userVariableName}, {}),
      })
    }

    it('returns the index of ${fullyQualifiedModelName}s', async () => {
      const ${modelVariableName} = await create${modelClassName}({
        ${attachedModelVariableName || userVariableName}${originalStringKeyValues.length ? ',\n        ' + originalStringKeyValues.join('\n        ') : ''}
      })
      const { body } = await subject(200)

      expect(body).toEqual([
        expect.objectContaining({
          id: ${modelVariableName}.id,
        }),
      ])
    })

    context('${modelClassName}s created by another ${owningModelClassName}', () => {
      it('are omitted', async () => {
        await create${modelClassName}()
        const { body } = await subject(200)

        expect(body).toEqual([])
      })
    })
  })

  describe('GET show', () => {
    const subject = async <StatusCode extends 200 | 400 | 404>(${modelVariableName}: ${modelClassName}, expectedStatus: StatusCode) => {
      return request.get('/${route}/{id}', expectedStatus, {
        id: ${modelVariableName}.id,
        headers: await addEndUserAuthHeader(request, ${userVariableName}, {}),
      })
    }

    it('returns the specified ${fullyQualifiedModelName}', async () => {
      const ${modelVariableName} = await create${modelClassName}({
        ${attachedModelVariableName || userVariableName}${originalStringKeyValues.length ? ',\n        ' + originalStringKeyValues.join('\n        ') : ''}
      })
      const { body } = await subject(${modelVariableName}, 200)

      expect(body).toEqual(
        expect.objectContaining({
          id: ${modelVariableName}.id,${originalStringKeyValues.length ? '\n          ' + originalStringKeyValues.join('\n          ') : ''}
        }),
      )
    })

    context('${fullyQualifiedModelName} created by another ${owningModelClassName}', () => {
      it('is not found', async () => {
        const other${owningModelClassName}${modelClassName} = await create${modelClassName}()
        await subject(other${owningModelClassName}${modelClassName}, 404)
      })
    })
  })

  describe('POST create', () => {
    const subject = async <StatusCode extends 201 | 400>(
      data: UpdateableProperties<${modelClassName}>,
      expectedStatus: StatusCode
    ) => {
      return request.post('/${route}', expectedStatus, {
        data,
        headers: await addEndUserAuthHeader(request, ${userVariableName}, {}),
      })
    }

    it('creates a ${fullyQualifiedModelName} for this ${owningModelClassName}', async () => {
      const { body } = await subject({
        ${originalStringKeyValues.length ? originalStringKeyValues.join('\n        ') : ''}
      }, 201)
      const ${modelVariableName} = await ${modelClassName}.findOrFailBy({ ${userVariableName}Id: ${userVariableName}.id })

      expect(body).toEqual(
        expect.objectContaining({
          id: ${modelVariableName}.id,${originalStringKeyValues.length ? '\n          ' + originalStringKeyValues.join('\n          ') : ''}
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
        headers: await addEndUserAuthHeader(request, ${userVariableName}, {}),
      })
    }

    it('updates the ${fullyQualifiedModelName}', async () => {
      const ${modelVariableName} = await create${modelClassName}({
        ${attachedModelVariableName || userVariableName}${originalStringKeyValues.length ? ',\n        ' + originalStringKeyValues.join('\n        ') : ''}
      })
      await subject(${modelVariableName}, {
        ${updatedStringKeyValues.length ? updatedStringKeyValues.join('\n        ') : ''}
      }, 204)

      await ${modelVariableName}.reload()
      ${updatedStringAttributeChecks.join('\n      ')}
    })

    context('a ${fullyQualifiedModelName} created by another ${owningModelClassName}', () => {
      it('is not updated', async () => {
        const ${modelVariableName} = await create${modelClassName}()
        await subject(${modelVariableName}, {
          ${updatedStringKeyValues.length ? updatedStringKeyValues.join('\n          ') : ''}
        }, 404)

        await ${modelVariableName}.reload()
        ${originalStringAttributeChecks.join('\n        ')}
      })
    })
  })

  describe('DELETE destroy', () => {
    const subject = async <StatusCode extends 204 | 400 | 404>(${modelVariableName}: ${modelClassName}, expectedStatus: StatusCode) => {
      return request.delete('/${route}/{id}', expectedStatus, {
        id: ${modelVariableName}.id,
        headers: await addEndUserAuthHeader(request, ${userVariableName}, {}),
      })
    }

    it('deletes the ${fullyQualifiedModelName}', async () => {
      const ${modelVariableName} = await create${modelClassName}({ ${attachedModelVariableName || userVariableName} })
      await subject(${modelVariableName}, 204)

      expect(await ${modelClassName}.find(${modelVariableName}.id)).toBeNull()
    })

    context('a ${fullyQualifiedModelName} created by another ${owningModelClassName}', () => {
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

function importStatementForType(typeFilePath: string, typeExportName: string) {
  const importPath = relativePsychicPath('controllerSpecs', 'types', typeFilePath).toLowerCase()
  return `\nimport { ${typeExportName} } from '${importPath}'`
}

function importStatementForModelFactory(
  originModelName: string,
  destinationModelName: string = originModelName,
) {
  return `\nimport create${globalClassNameFromFullyQualifiedModelName(destinationModelName)} from '${relativePsychicPath('controllerSpecs', 'factories', originModelName, destinationModelName)}'`
}
