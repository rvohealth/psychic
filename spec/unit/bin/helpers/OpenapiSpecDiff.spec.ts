import * as fs from 'node:fs'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  BreakingChangesDetectedInOpenApiSpecError,
  OpenApiSpecDiff,
} from '../../../../src/bin/helpers/OpenApiSpecDiff.js'
import type { DefaultPsychicOpenapiOptions } from '../../../../src/psychic-app/index.js'

interface OpenapiFile {
  paths: {
    '/api/pets/{id}': {
      parameters: {
        in: string
        name: string
        required: boolean
        description: string
        schema: { type: string }
      }[]
    }
  }
  components: {
    schemas: {
      Pet: {
        type: 'object'
        required: string[]
        properties: {
          name: {
            type: string[]
          }
          newProperty: {
            type: string[]
          }
        }
      }
    }
  }
}

describe('OpenApiSpecDiff', () => {
  const mockConfigs: [string, DefaultPsychicOpenapiOptions][] = [
    ['api1', { outputFilepath: 'test-app/src/openapi/openapi.json' }],
  ]

  let originalFileContent: string

  beforeEach(() => {
    originalFileContent = fs.readFileSync('./test-app/src/openapi/openapi.json', 'utf8')
  })

  afterEach(() => {
    fs.writeFileSync('./test-app/src/openapi/openapi.json', originalFileContent)
  })

  describe('compare', () => {
    it('is successful - no changes detected', () => {
      expect(() => {
        OpenApiSpecDiff.compare(mockConfigs)
      }).not.toThrow()
    })

    context('when removing a required field', () => {
      it('throws a breaking change', () => {
        const doc: OpenapiFile = JSON.parse(originalFileContent) as OpenapiFile

        doc.components.schemas.Pet.required = []
        fs.writeFileSync('./test-app/src/openapi/openapi.json', JSON.stringify(doc, null, 2))

        expect(() => {
          OpenApiSpecDiff.compare(mockConfigs)
        }).toThrow(BreakingChangesDetectedInOpenApiSpecError)
      })
    })
    context('when making a non-breaking change', () => {
      it('logs the change but does not throw an error', () => {
        const doc: OpenapiFile = JSON.parse(originalFileContent) as OpenapiFile

        doc.paths['/api/pets/{id}'].parameters.push({
          in: 'query',
          name: 'newQueryParam',
          required: false,
          description: 'new query param',
          schema: { type: 'string' },
        })
        fs.writeFileSync('./test-app/src/openapi/openapi.json', JSON.stringify(doc, null, 2))

        expect(() => {
          OpenApiSpecDiff.compare(mockConfigs)
        }).not.toThrow(BreakingChangesDetectedInOpenApiSpecError)
      })
    })
  })
})
