import { DreamCLI } from '@rvoh/dream/system'
import * as fs from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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

    context('when the openapi spec is large enough to exceed the default maxBuffer', () => {
      it('does not produce an ENOBUFS error', { timeout: 30_000 }, () => {
        const doc = JSON.parse(originalFileContent) as Record<string, unknown>
        const paths = doc.paths as Record<string, unknown>

        for (let i = 0; i < 5000; i++) {
          paths[`/api/generated/path_${i}`] = {
            get: {
              summary: `Generated endpoint ${i}`,
              description: `A long description for endpoint ${i}`,
              operationId: `getGenerated${i}`,
              parameters: [
                { in: 'query', name: `param_a_${i}`, schema: { type: 'string' } },
                { in: 'query', name: `param_b_${i}`, schema: { type: 'integer' } },
                { in: 'query', name: `param_c_${i}`, schema: { type: 'boolean' } },
              ],
              responses: {
                '200': {
                  description: 'Success',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          id: { type: 'integer' },
                          name: { type: 'string' },
                          data: { type: 'string' },
                          extra: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
            post: {
              summary: `Create endpoint ${i}`,
              operationId: `postGenerated${i}`,
              requestBody: {
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: { name: { type: 'string' }, data: { type: 'string' } },
                    },
                  },
                },
              },
              responses: { '201': { description: 'Created' } },
            },
          }
        }

        fs.writeFileSync('./test-app/src/openapi/openapi.json', JSON.stringify(doc, null, 2))

        const loggedMessages: string[] = []
        const spy = vi.spyOn(DreamCLI.logger, 'logContinueProgress').mockImplementation((message: string) => {
          loggedMessages.push(message)
        })

        try {
          OpenApiSpecDiff.compare(mockConfigs)
        } finally {
          spy.mockRestore()
        }

        const hasEnobufs = loggedMessages.some(msg => msg.includes('ENOBUFS'))
        expect(hasEnobufs).toBe(false)
      })
    })
  })
})
