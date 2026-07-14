import * as fs from 'node:fs'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  BreakingChangesDetectedInOpenApiSpecError,
  OasDiffConfig,
  OpenApiSpecDiff,
  OpenApiSpecDiffToolFailureError,
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

// Diffs against a controlled baseline (the spec file's committed contents at the
// start of each test) rather than the live head branch. This keeps the suite
// deterministic: it exercises oasdiff's breaking/non-breaking classification
// without depending on the working-tree fixture being byte-identical to `main`.
// (This PR intentionally drops `passwordDigest` from several request bodies, so
// the fixture is NOT identical to the live `main` until this merges.) The
// production diff — `psy openapi:spec-diff` against real `main` — is unchanged.
class ControlledBaselineOpenApiSpecDiff extends OpenApiSpecDiff {
  constructor(private readonly baselineContent: string) {
    super()
  }

  protected override getHeadBranchContent(): string {
    return this.baselineContent
  }
}

// Simulates the oasdiff binary itself failing (not installed correctly,
// internal oasdiff error, etc.) by pointing the diff at a command that
// cannot be invoked. The real `runOasDiffCommand` error path is exercised.
class FailingOasdiffCommandOpenApiSpecDiff extends ControlledBaselineOpenApiSpecDiff {
  protected override getOasDiffConfig(): OasDiffConfig {
    return {
      command: 'oasdiff-command-that-does-not-exist-for-specs',
      baseArgs: [],
      headBranch: 'main',
    }
  }
}

// Simulates an unreadable head-branch spec (e.g. `git show` failing for the
// file) so the per-file retrieval error path is exercised.
class UnreadableHeadBranchOpenApiSpecDiff extends OpenApiSpecDiff {
  protected override getHeadBranchContent(): string {
    throw new Error('simulated: could not read file from head branch')
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
      const diff = new ControlledBaselineOpenApiSpecDiff(originalFileContent)
      expect(() => {
        diff.compare(mockConfigs)
      }).not.toThrow()
    })

    context('when removing a required field', () => {
      it('throws a breaking change', () => {
        const diff = new ControlledBaselineOpenApiSpecDiff(originalFileContent)
        const doc: OpenapiFile = JSON.parse(originalFileContent) as OpenapiFile

        doc.components.schemas.Pet.required = []
        fs.writeFileSync('./test-app/src/openapi/openapi.json', JSON.stringify(doc, null, 2))

        expect(() => {
          diff.compare(mockConfigs)
        }).toThrow(BreakingChangesDetectedInOpenApiSpecError)
      })
    })
    context('when the oasdiff invocation itself fails', () => {
      it('throws OpenApiSpecDiffToolFailureError rather than reporting no breaking changes', () => {
        const diff = new FailingOasdiffCommandOpenApiSpecDiff(originalFileContent)

        expect(() => {
          diff.compare(mockConfigs)
        }).toThrow(OpenApiSpecDiffToolFailureError)
      })

      it('distinguishes tool failure from a breaking-changes result in its message', () => {
        const diff = new FailingOasdiffCommandOpenApiSpecDiff(originalFileContent)

        expect(() => {
          diff.compare(mockConfigs)
        }).toThrow(/tool failure, NOT a breaking-changes result/)
      })
    })

    context('when the spec file does not exist in the current branch', () => {
      it('throws OpenApiSpecDiffToolFailureError', () => {
        const diff = new ControlledBaselineOpenApiSpecDiff(originalFileContent)

        expect(() => {
          diff.compare([['api1', { outputFilepath: 'test-app/src/openapi/nonexistent.json' }]])
        }).toThrow(OpenApiSpecDiffToolFailureError)
      })
    })

    context('when head-branch content cannot be retrieved for a file', () => {
      it('throws OpenApiSpecDiffToolFailureError instead of escaping with a raw error', () => {
        const diff = new UnreadableHeadBranchOpenApiSpecDiff()

        expect(() => {
          diff.compare(mockConfigs)
        }).toThrow(OpenApiSpecDiffToolFailureError)
      })
    })

    context('when making a non-breaking change', () => {
      it('logs the change but does not throw an error', () => {
        const diff = new ControlledBaselineOpenApiSpecDiff(originalFileContent)
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
          diff.compare(mockConfigs)
        }).not.toThrow(BreakingChangesDetectedInOpenApiSpecError)
      })
    })
  })
})
