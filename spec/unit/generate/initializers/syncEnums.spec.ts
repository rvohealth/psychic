import { hyphenize } from '@rvoh/dream/utils'
import fs from 'node:fs/promises'
import { CannotConfirmOverwriteError } from '../../../../src/cli/helpers/confirmOverwrite.js'
import generateSyncEnumsInitializer from '../../../../src/generate/initializer/syncEnums.js'

describe('generateSyncEnumsInitializer', () => {
  const initializerPath = './test-app/src/conf/initializers/sync-enums-mobile.ts'
  const trickyOpenapiName = 'partner\'s "mobile"\\v1'
  const trickyInitializerPath = `./test-app/src/conf/initializers/sync-enums-${hyphenize(trickyOpenapiName)}.ts`

  function initializerContents(
    syncClientEnumsArgs: string,
    {
      functionName = 'syncEnumsMobile',
      outfile = './client/howyadoin/enums.ts',
    }: { functionName?: string; outfile?: string } = {},
  ) {
    return `\
import { DreamCLI } from '@rvoh/dream/system'
import { PsychicApp } from "@rvoh/psychic"
import { PsychicBin } from "@rvoh/psychic/system"
import AppEnv from '../AppEnv.js'

export default function ${functionName}(psy: PsychicApp) {
  psy.on('cli:sync', async () => {
    if (AppEnv.isDevelopmentOrTest) {
      await DreamCLI.logger.logProgress(${JSON.stringify(`[${functionName}] syncing enums to ${outfile}...`)}, async () => {
        await PsychicBin.syncClientEnums(${syncClientEnumsArgs})
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
    for (const filepath of [
      './test-app/src/conf/initializers/sync-enums.ts',
      initializerPath,
      trickyInitializerPath,
    ]) {
      try {
        await fs.rm(filepath)
      } catch {
        // noop
      }
    }
  }

  it('derives the initializer filename from the openapiName and bakes the outfile and openapiName into the enum sync', async () => {
    await generateSyncEnumsInitializer('./client/howyadoin/enums.ts', 'mobile')

    const contents = (await fs.readFile(initializerPath)).toString()
    expect(contents).toEqual(initializerContents(`"./client/howyadoin/enums.ts", "mobile"`))
  })

  context("when the openapiName is 'default'", () => {
    it('generates sync-enums.ts, matching the unnamed spec registration', async () => {
      await generateSyncEnumsInitializer('./client/howyadoin/enums.ts', 'default')

      const contents = (await fs.readFile('./test-app/src/conf/initializers/sync-enums.ts')).toString()
      expect(contents).toEqual(
        initializerContents(`"./client/howyadoin/enums.ts", "default"`, { functionName: 'syncEnums' }),
      )
    })
  })

  context('when no openapiName is provided', () => {
    it('generates sync-enums.ts with the source-compatible one-argument call, which syncs the default spec', async () => {
      await generateSyncEnumsInitializer('./client/howyadoin/enums.ts')

      const contents = (await fs.readFile('./test-app/src/conf/initializers/sync-enums.ts')).toString()
      expect(contents).toEqual(
        initializerContents(`"./client/howyadoin/enums.ts"`, { functionName: 'syncEnums' }),
      )
    })
  })

  context('when the outfile or openapiName contains quotes, backslashes, or template syntax', () => {
    const trickyOutfile = './client/weird `path`/it\'s "quoted"\\${dir}/enums.ts'

    it('escapes the syncClientEnums arguments so they round-trip the exact strings', async () => {
      await generateSyncEnumsInitializer(trickyOutfile, trickyOpenapiName)

      const contents = (await fs.readFile(trickyInitializerPath)).toString()
      const argsMatch = contents.match(/PsychicBin\.syncClientEnums\((.*)\)/)
      expect(argsMatch).not.toBeNull()
      // the embedded literals must decode back to the exact original strings
      expect(JSON.parse(`[${argsMatch![1]}]`)).toEqual([trickyOutfile, trickyOpenapiName])
    })

    it('escapes the outfile embedded in the log-progress message and strips invalid identifier characters from the function name', async () => {
      await generateSyncEnumsInitializer(trickyOutfile, trickyOpenapiName)

      const contents = (await fs.readFile(trickyInitializerPath)).toString()
      const functionMatch = contents.match(/export default function ([A-Za-z0-9_$]+)\(psy: PsychicApp\) \{/)
      expect(functionMatch).not.toBeNull()

      const logMatch = contents.match(/logProgress\((.*), async \(\) => \{/)
      const logLiteral = logMatch?.[1]
      expect(logLiteral).toBeDefined()
      expect(JSON.parse(logLiteral!)).toEqual(`[${functionMatch![1]}] syncing enums to ${trickyOutfile}...`)
    })
  })

  context('when the initializer file already exists', () => {
    context('with byte-identical contents', () => {
      it('silently no-ops without prompting', async () => {
        await generateSyncEnumsInitializer('./client/howyadoin/enums.ts', 'mobile')

        const confirm = vi.fn()
        await generateSyncEnumsInitializer('./client/howyadoin/enums.ts', 'mobile', { confirm })

        expect(confirm).not.toHaveBeenCalled()
        expect((await fs.readFile(initializerPath)).toString()).toEqual(
          initializerContents(`"./client/howyadoin/enums.ts", "mobile"`),
        )
      })
    })

    context('with different contents (same spec, different outfile)', () => {
      beforeEach(async () => {
        await generateSyncEnumsInitializer('./client/howyadoin/enums.ts', 'mobile')
      })

      it('prompts with the initializer path and overwrites on confirmation', async () => {
        const confirm = vi.fn().mockResolvedValue(true)

        await generateSyncEnumsInitializer('./client/elsewhere/enums.ts', 'mobile', { confirm })

        expect(confirm).toHaveBeenCalledWith([expect.stringContaining('sync-enums-mobile.ts') as string])
        expect((await fs.readFile(initializerPath)).toString()).toEqual(
          initializerContents(`"./client/elsewhere/enums.ts", "mobile"`, {
            outfile: './client/elsewhere/enums.ts',
          }),
        )
      })

      it('leaves the existing file untouched when the prompt is declined', async () => {
        const confirm = vi.fn().mockResolvedValue(false)

        await generateSyncEnumsInitializer('./client/elsewhere/enums.ts', 'mobile', { confirm })

        expect((await fs.readFile(initializerPath)).toString()).toEqual(
          initializerContents(`"./client/howyadoin/enums.ts", "mobile"`),
        )
      })

      context('but the existing file cannot be read (e.g. EACCES)', () => {
        afterEach(async () => {
          await fs.chmod(initializerPath, 0o600).catch(() => undefined)
        })

        it('rethrows the read failure without confirming or writing (unreadable is not the same as missing)', async () => {
          await fs.chmod(initializerPath, 0o200)
          const confirm = vi.fn()

          await expect(
            generateSyncEnumsInitializer('./client/elsewhere/enums.ts', 'mobile', { confirm }),
          ).rejects.toThrow(/EACCES/)

          expect(confirm).not.toHaveBeenCalled()
          await fs.chmod(initializerPath, 0o600)
          expect((await fs.readFile(initializerPath)).toString()).toEqual(
            initializerContents(`"./client/howyadoin/enums.ts", "mobile"`),
          )
        })
      })

      it('overwrites without prompting when overwrite: true is passed (non-interactive consent)', async () => {
        // BYPASS_CLI_PROMPT=1 (set for this suite) makes the default confirm
        // throw, so success here proves the flag skips the prompt entirely
        await generateSyncEnumsInitializer('./client/elsewhere/enums.ts', 'mobile', { overwrite: true })

        expect((await fs.readFile(initializerPath)).toString()).toEqual(
          initializerContents(`"./client/elsewhere/enums.ts", "mobile"`, {
            outfile: './client/elsewhere/enums.ts',
          }),
        )
      })

      it('fails loudly instead of silently choosing when the prompt is bypassed', async () => {
        // BYPASS_CLI_PROMPT=1 (set for this suite) would short-circuit
        // cliPrompt to '', so the default confirm must throw rather than
        // treating that as an answer
        await expect(generateSyncEnumsInitializer('./client/elsewhere/enums.ts', 'mobile')).rejects.toThrow(
          CannotConfirmOverwriteError,
        )

        expect((await fs.readFile(initializerPath)).toString()).toEqual(
          initializerContents(`"./client/howyadoin/enums.ts", "mobile"`),
        )
      })
    })

    context('when a different spec is synced', () => {
      it('creates a sibling initializer rather than prompting to overwrite (one initializer per spec)', async () => {
        await generateSyncEnumsInitializer('./client/howyadoin/enums.ts', 'default')

        const confirm = vi.fn()
        await generateSyncEnumsInitializer('./client/mobile/enums.ts', 'mobile', { confirm })

        expect(confirm).not.toHaveBeenCalled()
        expect((await fs.readFile('./test-app/src/conf/initializers/sync-enums.ts')).toString()).toEqual(
          initializerContents(`"./client/howyadoin/enums.ts", "default"`, { functionName: 'syncEnums' }),
        )
        expect((await fs.readFile(initializerPath)).toString()).toEqual(
          initializerContents(`"./client/mobile/enums.ts", "mobile"`, {
            outfile: './client/mobile/enums.ts',
          }),
        )
      })
    })
  })
})
