import { Command } from 'commander'
import type { MockInstance } from 'vitest'
import PsychicCLI from '../../../src/cli/index.js'
import generateSyncEnumsInitializer from '../../../src/generate/initializer/syncEnums.js'
import generateSyncOpenapiTypescriptInitializer from '../../../src/generate/initializer/syncOpenapiTypescript.js'
import generateOpenapiReduxBindings from '../../../src/generate/openapi/reduxBindings.js'
import generateOpenapiZustandBindings from '../../../src/generate/openapi/zustandBindings.js'
import PsychicApp from '../../../src/psychic-app/index.js'

vi.mock('../../../src/generate/initializer/syncEnums.js')
vi.mock('../../../src/generate/initializer/syncOpenapiTypescript.js')
vi.mock('../../../src/generate/openapi/reduxBindings.js')
vi.mock('../../../src/generate/openapi/zustandBindings.js')

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
    it('passes --openapi-name through to the initializer generator', async () => {
      await buildProgram().parseAsync(
        ['setup:sync:enums', '--output-file=../client/src/api/enums.ts', '--openapi-name=mobile'],
        { from: 'user' },
      )

      expect(generateSyncEnumsInitializer).toHaveBeenCalledWith('../client/src/api/enums.ts', 'mobile', {
        overwrite: false,
      })
    })

    it('passes --overwrite through as pre-given consent', async () => {
      await buildProgram().parseAsync(
        ['setup:sync:enums', '--output-file=../client/src/api/enums.ts', '--overwrite'],
        { from: 'user' },
      )

      expect(generateSyncEnumsInitializer).toHaveBeenCalledWith('../client/src/api/enums.ts', 'default', {
        overwrite: true,
      })
    })

    context('when --openapi-name is omitted', () => {
      it("passes 'default' so the generator derives the default sync-enums.ts filename", async () => {
        await buildProgram().parseAsync(['setup:sync:enums', '--output-file=../client/src/api/enums.ts'], {
          from: 'user',
        })

        expect(generateSyncEnumsInitializer).toHaveBeenCalledWith('../client/src/api/enums.ts', 'default', {
          overwrite: false,
        })
      })
    })

    it('does not accept --initializer-filename (the filename is derived from the spec name)', async () => {
      const program = new Command()
      program.exitOverride()
      program.configureOutput({ writeErr: () => {} })
      PsychicCLI.provide(program, {
        initializePsychicApp: () => Promise.resolve(PsychicApp.getOrFail()),
        seedDb: () => {},
      })

      await expect(
        program.parseAsync(
          [
            'setup:sync:enums',
            '--output-file=../client/src/api/enums.ts',
            '--initializer-filename=custom.ts',
          ],
          { from: 'user' },
        ),
      ).rejects.toMatchObject({ code: 'commander.unknownOption' })

      expect(generateSyncEnumsInitializer).not.toHaveBeenCalled()
    })

    context('pre-3.12 positional invocation (`setup:sync:enums <outfile>`)', () => {
      // 3.12.0 replaced the positional outfile with named options and promises that
      // old positional invocations fail loudly. These specs pin that promise: commander
      // must reject before the initializer generator runs. If the positional `.argument`
      // were ever restored, the bare-positional invocation below would succeed (calling
      // the generator) and these specs would fail.
      function buildThrowingProgram(): Command {
        const program = new Command()
        // exitOverride/configureOutput must be set before PsychicCLI.provide so the
        // subcommands inherit them: commander then throws CommanderError instead of
        // calling process.exit, and writes nothing to stderr
        program.exitOverride()
        program.configureOutput({ writeErr: () => {} })

        PsychicCLI.provide(program, {
          initializePsychicApp: () => Promise.resolve(PsychicApp.getOrFail()),
          seedDb: () => {},
        })

        return program
      }

      it('rejects a bare positional outfile with commander.missingMandatoryOptionValue and never calls the generator', async () => {
        await expect(
          buildThrowingProgram().parseAsync(['setup:sync:enums', '../client/src/api/enums.ts'], {
            from: 'user',
          }),
        ).rejects.toMatchObject({
          code: 'commander.missingMandatoryOptionValue',
          message: "error: required option '--output-file <outputFile>' not specified",
        })

        expect(generateSyncEnumsInitializer).not.toHaveBeenCalled()
      })

      it('rejects a positional outfile alongside --output-file with commander.excessArguments and never calls the generator', async () => {
        await expect(
          buildThrowingProgram().parseAsync(
            ['setup:sync:enums', '../client/src/api/enums.ts', '--output-file=../client/src/api/enums.ts'],
            { from: 'user' },
          ),
        ).rejects.toMatchObject({
          code: 'commander.excessArguments',
          message: "error: too many arguments for 'setup:sync:enums'. Expected 0 arguments but got 1.",
        })

        expect(generateSyncEnumsInitializer).not.toHaveBeenCalled()
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
        { overwrite: false },
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
          { overwrite: false },
        )
      })
    })
  })

  describe('--overwrite pass-through on the binding generators', () => {
    it('setup:sync:openapi-redux passes --overwrite as pre-given consent', async () => {
      await buildProgram().parseAsync(
        [
          'setup:sync:openapi-redux',
          '--schema-file=./src/openapi/openapi.json',
          '--api-file=../client/app/api.ts',
          '--api-import=emptyBackendApi',
          '--output-file=../client/app/backendApi.ts',
          '--export-name=backendApi',
          '--overwrite',
        ],
        { from: 'user' },
      )

      expect(generateOpenapiReduxBindings).toHaveBeenCalledWith(
        {
          exportName: 'backendApi',
          schemaFile: './src/openapi/openapi.json',
          apiFile: '../client/app/api.ts',
          apiImport: 'emptyBackendApi',
          outputFile: '../client/app/backendApi.ts',
        },
        { overwrite: true },
      )
    })

    it('setup:sync:openapi-zustand passes --overwrite as pre-given consent', async () => {
      await buildProgram().parseAsync(
        [
          'setup:sync:openapi-zustand',
          '--schema-file=./src/openapi/openapi.json',
          '--output-dir=../client/app/api/backend',
          '--client-config-file=../client/app/api/backend/client.ts',
          '--export-name=backendApi',
          '--overwrite',
        ],
        { from: 'user' },
      )

      expect(generateOpenapiZustandBindings).toHaveBeenCalledWith(
        {
          exportName: 'backendApi',
          schemaFile: './src/openapi/openapi.json',
          outputDir: '../client/app/api/backend',
          clientConfigFile: '../client/app/api/backend/client.ts',
        },
        { overwrite: true },
      )
    })

    it('setup:sync:openapi-typescript passes --overwrite as pre-given consent', async () => {
      await buildProgram().parseAsync(
        [
          'setup:sync:openapi-typescript',
          './src/openapi/openapi.json',
          '../client/src/api/types.d.ts',
          '--overwrite',
        ],
        { from: 'user' },
      )

      expect(generateSyncOpenapiTypescriptInitializer).toHaveBeenCalledWith(
        './src/openapi/openapi.json',
        '../client/src/api/types.d.ts',
        undefined,
        { overwrite: true },
      )
    })
  })
})
