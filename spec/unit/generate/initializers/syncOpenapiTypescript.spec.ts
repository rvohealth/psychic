import { DreamCLI } from '@rvoh/dream/system'
import fs from 'node:fs/promises'
import { CannotConfirmOverwriteError } from '../../../../src/cli/helpers/confirmOverwrite.js'
import generateInitializer from '../../../../src/generate/helpers/syncOpenapiTypescript/generateInitializer.js'
import generateSyncOpenapiTypescriptInitializer from '../../../../src/generate/initializer/syncOpenapiTypescript.js'
import EnvInternal from '../../../../src/helpers/EnvInternal.js'

describe('generateSyncOpenapiTypescriptInitializer', () => {
  const initializerPath = 'test-app/src/conf/initializers/sync-openapi-typescript.ts'

  function initializerContents(openapiFilepath: string, outfile: string) {
    return `\
import { DreamCLI } from '@rvoh/dream/system'
import { PsychicApp } from "@rvoh/psychic"
import AppEnv from '../AppEnv.js'

export default (psy: PsychicApp) => {
  psy.on('cli:sync', async () => {
    if (AppEnv.isDevelopmentOrTest) {
      await DreamCLI.logger.logProgress(\`[sync-openapi-typescript] extracting types from ${openapiFilepath} to ${outfile}...\`, async () => {
        await DreamCLI.spawn('pnpm', { args: ["exec","openapi-typescript","${openapiFilepath}","-o","${outfile}"] })
      })
    }
  })
}`
  }

  beforeAll(() => {
    process.env.BYPASS_CLI_PROMPT = '1'
  })

  beforeEach(async () => {
    await cleanup()
  })

  afterEach(async () => {
    await cleanup()
  })

  async function cleanup() {
    try {
      await fs.rm('./test-app/src/conf/initializers/sync-openapi-typescript.ts')
    } catch {
      // noop
    }

    try {
      await fs.rm('./test-app/src/conf/initializers/sync-custom-openapi-typescript.ts')
    } catch {
      // noop
    }
  }

  it('generates a psychic initializer to conduct the openapi-typescript type sync', async () => {
    await generateSyncOpenapiTypescriptInitializer('./openapi.json', './sync-custom-openapi-typescript.d.ts')

    const contents = (
      await fs.readFile('test-app/src/conf/initializers/sync-openapi-typescript.ts')
    ).toString()
    expect(contents).toEqual(initializerContents('./openapi.json', './sync-custom-openapi-typescript.d.ts'))
  })

  context('when the initializer file already exists', () => {
    context('with byte-identical contents', () => {
      it('silently no-ops without prompting', async () => {
        await generateInitializer('./openapi.json', './types.d.ts', 'sync-openapi-typescript.ts')

        const confirm = vi.fn()
        await generateInitializer('./openapi.json', './types.d.ts', 'sync-openapi-typescript.ts', {
          confirm,
        })

        expect(confirm).not.toHaveBeenCalled()
        expect((await fs.readFile(initializerPath)).toString()).toEqual(
          initializerContents('./openapi.json', './types.d.ts'),
        )
      })
    })

    context('with different contents', () => {
      beforeEach(async () => {
        await generateInitializer('./openapi.json', './types.d.ts', 'sync-openapi-typescript.ts')
      })

      it('prompts with the initializer path and overwrites on confirmation (previously it silently overwrote)', async () => {
        const confirm = vi.fn().mockResolvedValue(true)

        await generateInitializer(
          './admin.openapi.json',
          './admin.types.d.ts',
          'sync-openapi-typescript.ts',
          {
            confirm,
          },
        )

        expect(confirm).toHaveBeenCalledTimes(1)
        expect(confirm).toHaveBeenCalledWith([
          expect.stringContaining('sync-openapi-typescript.ts') as string,
        ])
        expect((await fs.readFile(initializerPath)).toString()).toEqual(
          initializerContents('./admin.openapi.json', './admin.types.d.ts'),
        )
      })

      it('leaves the existing file untouched when the prompt is declined', async () => {
        const confirm = vi.fn().mockResolvedValue(false)

        await generateInitializer(
          './admin.openapi.json',
          './admin.types.d.ts',
          'sync-openapi-typescript.ts',
          {
            confirm,
          },
        )

        expect((await fs.readFile(initializerPath)).toString()).toEqual(
          initializerContents('./openapi.json', './types.d.ts'),
        )
      })

      context('the follow-on openapi-typescript install (observable only through the public wrapper)', () => {
        let spawnSpy: ReturnType<typeof vi.spyOn>

        beforeEach(() => {
          // installOpenapiTypescript early-returns under EnvInternal.isTest,
          // so stub it out to observe whether the install would run for real users
          vi.spyOn(EnvInternal, 'isTest', 'get').mockReturnValue(false)
          spawnSpy = vi.spyOn(DreamCLI, 'spawn').mockResolvedValue(undefined)
        })

        afterEach(() => {
          vi.restoreAllMocks()
        })

        it('skips the install when the overwrite prompt is declined', async () => {
          const confirm = vi.fn().mockResolvedValue(false)

          await generateSyncOpenapiTypescriptInitializer(
            './admin.openapi.json',
            './admin.types.d.ts',
            'sync-openapi-typescript.ts',
            { confirm },
          )

          expect(spawnSpy).not.toHaveBeenCalled()
          expect((await fs.readFile(initializerPath)).toString()).toEqual(
            initializerContents('./openapi.json', './types.d.ts'),
          )
        })

        it('runs the install when the overwrite is confirmed', async () => {
          const confirm = vi.fn().mockResolvedValue(true)

          await generateSyncOpenapiTypescriptInitializer(
            './admin.openapi.json',
            './admin.types.d.ts',
            'sync-openapi-typescript.ts',
            { confirm },
          )

          expect(spawnSpy).toHaveBeenCalledWith('pnpm', { args: ['add', '-D', 'openapi-typescript'] })
        })
      })

      it('fails loudly instead of silently choosing when the prompt is bypassed', async () => {
        // BYPASS_CLI_PROMPT=1 (set for this suite) would short-circuit
        // cliPrompt to '', so the default confirm must throw rather than
        // treating that as an answer
        await expect(
          generateInitializer('./admin.openapi.json', './admin.types.d.ts', 'sync-openapi-typescript.ts'),
        ).rejects.toThrow(CannotConfirmOverwriteError)

        expect((await fs.readFile(initializerPath)).toString()).toEqual(
          initializerContents('./openapi.json', './types.d.ts'),
        )
      })
    })
  })
})
