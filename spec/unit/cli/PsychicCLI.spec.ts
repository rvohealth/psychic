import { Command } from 'commander'
import type { MockInstance } from 'vitest'
import PsychicCLI from '../../../src/cli/index.js'
import generateSyncEnumsInitializer from '../../../src/generate/initializer/syncEnums.js'
import generateSyncOpenapiTypescriptInitializer from '../../../src/generate/initializer/syncOpenapiTypescript.js'
import PsychicApp from '../../../src/psychic-app/index.js'

vi.mock('../../../src/generate/initializer/syncEnums.js')
vi.mock('../../../src/generate/initializer/syncOpenapiTypescript.js')

describe('PsychicCLI setup:sync commands', () => {
  let processExitSpy: MockInstance

  function buildProgram(): Command {
    const program = new Command()

    PsychicCLI.provide(program, {
      initializePsychicApp: () => Promise.resolve(PsychicApp.getOrFail()),
      seedDb: () => {},
    })

    return program
  }

  beforeEach(() => {
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)
  })

  afterEach(() => {
    processExitSpy.mockRestore()
  })

  describe('setup:sync:enums', () => {
    it('passes --initializer-filename through to the initializer generator', async () => {
      await buildProgram().parseAsync(
        [
          'setup:sync:enums',
          '--output-file=../client/src/api/enums.ts',
          '--initializer-filename=custom-sync-enums.ts',
        ],
        { from: 'user' },
      )

      expect(generateSyncEnumsInitializer).toHaveBeenCalledWith(
        '../client/src/api/enums.ts',
        'custom-sync-enums.ts',
        'default',
      )
    })

    context('when --initializer-filename is omitted', () => {
      it('passes undefined so the generator applies its default filename', async () => {
        await buildProgram().parseAsync(['setup:sync:enums', '--output-file=../client/src/api/enums.ts'], {
          from: 'user',
        })

        expect(generateSyncEnumsInitializer).toHaveBeenCalledWith(
          '../client/src/api/enums.ts',
          undefined,
          'default',
        )
      })
    })
  })

  describe('setup:sync:openapi-typescript', () => {
    it('passes --initializer-filename through to the initializer generator', async () => {
      await buildProgram().parseAsync(
        [
          'setup:sync:openapi-typescript',
          './src/openapi/openapi.json',
          '../client/src/api/types.d.ts',
          '--initializer-filename=custom-sync-openapi-typescript.ts',
        ],
        { from: 'user' },
      )

      expect(generateSyncOpenapiTypescriptInitializer).toHaveBeenCalledWith(
        './src/openapi/openapi.json',
        '../client/src/api/types.d.ts',
        'custom-sync-openapi-typescript.ts',
      )
    })

    context('when --initializer-filename is omitted', () => {
      it('passes undefined so the generator applies its default filename', async () => {
        await buildProgram().parseAsync(
          ['setup:sync:openapi-typescript', './src/openapi/openapi.json', '../client/src/api/types.d.ts'],
          { from: 'user' },
        )

        expect(generateSyncOpenapiTypescriptInitializer).toHaveBeenCalledWith(
          './src/openapi/openapi.json',
          '../client/src/api/types.d.ts',
          undefined,
        )
      })
    })
  })
})
