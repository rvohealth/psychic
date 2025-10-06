import * as fs from 'node:fs'
import * as path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  BreakingChangesDetectedInOpenApiSpecError,
  OpenApiSpecDiff,
} from '../../../../src/bin/helpers/OpenApiSpecDiff.js'
import type { DefaultPsychicOpenapiOptions } from '../../../../src/psychic-app/index.js'

interface OpenapiFile {
  components: {
    schemas: {
      Pet: {
        type: 'object'
        required: string[]
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
    originalFileContent = fs.readFileSync(
      path.join(process.cwd(), 'test-app/src/openapi/openapi.json'),
      'utf8',
    )
  })

  afterEach(() => {
    fs.writeFileSync(path.join(process.cwd(), 'test-app/src/openapi/openapi.json'), originalFileContent)
  })

  describe('compare', () => {
    it('is successful - no changes detected', () => {
      expect(() => {
        OpenApiSpecDiff.compare(mockConfigs)
      }).not.toThrow()
    })

    context('when removing a required field', () => {
      it('throws a breaking change', () => {
        const doc: OpenapiFile = JSON.parse(
          fs.readFileSync(path.join(process.cwd(), 'test-app/src/openapi/openapi.json'), 'utf8').toString(),
        ) as OpenapiFile

        doc.components.schemas.Pet.required = []
        fs.writeFileSync(
          path.join(process.cwd(), 'test-app/src/openapi/openapi.json'),
          JSON.stringify(doc, null, 2),
        )

        expect(() => {
          OpenApiSpecDiff.compare(mockConfigs)
        }).toThrow(BreakingChangesDetectedInOpenApiSpecError)
      })
    })
  })
})
