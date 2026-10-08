import { Command } from 'commander'
import type { MockInstance } from 'vitest'
import PsychicBin from '../../../src/bin/index.js'
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

function buildProgram(): Command {
  const program = new Command()

  PsychicCLI.provide(program, {
    initializePsychicApp: () => Promise.resolve(PsychicApp.getOrFail()),
    seedDb: () => {},
  })

  return program
}

describe('PsychicCLI setup:sync commands', () => {
  let processExitSpy: MockInstance

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

describe('PsychicCLI resolve-aliases', () => {
  let processExitSpy: MockInstance
  let resolveAliasesSpy: MockInstance
  let initializePsychicApp: ReturnType<typeof vi.fn<() => Promise<PsychicApp>>>

  // A build step runs this command right after tsc, where the app's database
  // and environment variables may be unavailable, so it must never initialize
  // the app
  function buildResolveAliasesProgram(): Command {
    const program = new Command()
    initializePsychicApp = vi.fn(() => Promise.resolve(PsychicApp.getOrFail()))

    PsychicCLI.provide(program, { initializePsychicApp, seedDb: () => {} })

    return program
  }

  beforeEach(() => {
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)
    resolveAliasesSpy = vi.spyOn(PsychicBin, 'resolveAliases').mockReturnValue({
      tsconfigPath: '/app/tsconfig.build.json',
      filesChanged: 0,
      specifiersRewritten: 0,
    })
  })

  afterEach(() => {
    processExitSpy.mockRestore()
    resolveAliasesSpy.mockRestore()
  })

  it('passes -p through as the project, without initializing the app, and exits', async () => {
    await buildResolveAliasesProgram().parseAsync(['resolve-aliases', '-p', './tsconfig.build.json'], {
      from: 'user',
    })

    expect(resolveAliasesSpy).toHaveBeenCalledWith({ project: './tsconfig.build.json' })
    expect(initializePsychicApp).not.toHaveBeenCalled()
    expect(processExitSpy).toHaveBeenCalledWith()
  })

  it('accepts --project', async () => {
    await buildResolveAliasesProgram().parseAsync(['resolve-aliases', '--project', './tsconfig.build.json'], {
      from: 'user',
    })

    expect(resolveAliasesSpy).toHaveBeenCalledWith({ project: './tsconfig.build.json' })
  })

  context('without -p', () => {
    it('passes no project, so the tsconfig defaults as it does for tsc', async () => {
      await buildResolveAliasesProgram().parseAsync(['resolve-aliases'], { from: 'user' })

      expect(resolveAliasesSpy).toHaveBeenCalledWith({ project: undefined })
      expect(initializePsychicApp).not.toHaveBeenCalled()
    })
  })
})

describe('PsychicCLI g:resource --help', () => {
  // The help is a static string, built before any app is initialized, so it
  // must stay true for every app rather than describe one app's configuration
  function gResourceHelp(): string {
    const command = buildProgram().commands.find(command => command.name() === 'generate:resource')
    if (!command) throw new Error('expected PsychicCLI to register generate:resource')
    return command.helpInformation()
  }

  context('--owning-model', () => {
    it("shows the id cast as following the app's primaryKeyType rather than one fixed cast type", () => {
      const help = gResourceHelp()

      expect(help).toContain(
        "Defaults to `this.currentUser` for non-admin routes (e.g., `this.currentUser.associationQuery('posts').findOrFail(this.castParam('id', <idType>))`).",
      )
      expect(help).toContain(
        "Defaults to `this.currentInternalUser` for internal namespaced controllers (e.g., `this.currentInternalUser.associationQuery('posts').findOrFail(this.castParam('id', <idType>))`).",
      )
      expect(help).toContain(
        "Defaults to `null` for admin namespaced controllers (e.g., `Post.findOrFail(this.castParam('id', <idType>))`).",
      )
      expect(help).toContain(
        "# results in `await this.currentHost.associationQuery('places').findOrFail(this.castParam('id', <idType>))`",
      )
      expect(help).toContain(
        "<idType> follows the app's `primaryKeyType` setting (conf/dream.ts): 'bigint' for bigint and bigserial, 'integer' for integer, and 'uuid' for uuid, uuid4 and uuid7.",
      )
      expect(help).not.toMatch(/castParam\('id', '/)
    })

    it('describes the owning model without typos', () => {
      expect(gResourceHelp()).toContain(
        'Supplying an owning model changes the generated code in the controller to be relative to the owning model.',
      )
    })
  })

  context('belongs_to columns', () => {
    it('names the FK column and association of a namespaced model for the last segment of its name', () => {
      const help = gResourceHelp()

      expect(help).toContain(
        'Health/Coach:belongs_to           # creates coach_id column + coach BelongsTo association (named for the last segment of the model name)',
      )
      expect(help).not.toContain('health_coach_id')
    })

    it('shows an alias renaming a namespaced association rather than stripping the namespace, which the default already does', () => {
      const help = gResourceHelp()

      expect(help).toContain(
        'Sports/Coach@sports_coach:belongs_to               # sports_coach_id column, sportsCoachId property, sportsCoach association',
      )
      expect(help).toContain('#   (without the alias, Sports/Coach:belongs_to would also create coach_id,')
      expect(help).toContain('#   coachId and coach, colliding with Health/Coach:belongs_to)')
      expect(help).not.toContain('strips the namespace')
    })
  })

  context('--sti-base-serializer', () => {
    it('says only the default base serializer includes the type attribute, and the summary only id', () => {
      const help = gResourceHelp()

      expect(help).toContain(
        'Creates generically typed base serializers (default and summary) that accept a `StiChildClass` parameter. When a `type` column is passed, as in the example below, the default serializer includes the `type` attribute with a per-child enum constraint, which allows consuming applications to determine the response shape based on the STI type discriminator. The summary serializer includes only `id`, so responses from the generated `index` action, which renders the summary, carry no `type`.',
      )
      expect(help).not.toContain('parameter and include the `type` attribute')
    })
  })
})
