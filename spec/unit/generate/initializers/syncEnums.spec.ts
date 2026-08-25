import fs from 'node:fs/promises'
import { CannotConfirmOverwriteError } from '../../../../src/cli/helpers/confirmOverwrite.js'
import generateSyncEnumsInitializer from '../../../../src/generate/initializer/syncEnums.js'

describe('generateSyncEnumsInitializer', () => {
  const initializerPath = './test-app/src/conf/initializers/sync-custom-enums.ts'

  function initializerContents(syncClientEnumsArgs: string, outfile: string = './client/howyadoin/enums.ts') {
    return `\
import { DreamCLI } from '@rvoh/dream/system'
import { PsychicApp } from "@rvoh/psychic"
import { PsychicBin } from "@rvoh/psychic/system"
import AppEnv from '../AppEnv.js'

export default function syncCustomEnums(psy: PsychicApp) {
  psy.on('cli:sync', async () => {
    if (AppEnv.isDevelopmentOrTest) {
      await DreamCLI.logger.logProgress(\`[syncCustomEnums] syncing enums to ${outfile}...\`, async () => {
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
    for (const filename of ['sync-enums.ts', 'sync-custom-enums.ts']) {
      try {
        await fs.rm(`./test-app/src/conf/initializers/${filename}`)
      } catch {
        // noop
      }
    }
  }

  it('generates a psychic initializer that bakes the outfile and the openapiName into the enum sync', async () => {
    await generateSyncEnumsInitializer('./client/howyadoin/enums.ts', 'sync-custom-enums.ts', 'mobile')

    const contents = (await fs.readFile(initializerPath)).toString()
    expect(contents).toEqual(initializerContents(`'./client/howyadoin/enums.ts', 'mobile'`))
  })

  context('when no openapiName is provided', () => {
    it('generates the source-compatible one-argument call, which syncs the default spec', async () => {
      await generateSyncEnumsInitializer('./client/howyadoin/enums.ts', 'sync-custom-enums.ts')

      const contents = (await fs.readFile(initializerPath)).toString()
      expect(contents).toEqual(initializerContents(`'./client/howyadoin/enums.ts'`))
    })
  })

  context('when the initializer file already exists', () => {
    context('with byte-identical contents', () => {
      it('silently no-ops without prompting', async () => {
        await generateSyncEnumsInitializer('./client/howyadoin/enums.ts', 'sync-custom-enums.ts', 'mobile')

        const confirm = vi.fn()
        await generateSyncEnumsInitializer('./client/howyadoin/enums.ts', 'sync-custom-enums.ts', 'mobile', {
          confirm,
        })

        expect(confirm).not.toHaveBeenCalled()
        expect((await fs.readFile(initializerPath)).toString()).toEqual(
          initializerContents(`'./client/howyadoin/enums.ts', 'mobile'`),
        )
      })
    })

    context('with different contents', () => {
      beforeEach(async () => {
        await generateSyncEnumsInitializer('./client/howyadoin/enums.ts', 'sync-custom-enums.ts', 'mobile')
      })

      it('prompts with the initializer path and overwrites on confirmation', async () => {
        const confirm = vi.fn().mockResolvedValue(true)

        await generateSyncEnumsInitializer(
          './client/howyadoin/enums.ts',
          'sync-custom-enums.ts',
          'internal',
          { confirm },
        )

        expect(confirm).toHaveBeenCalledWith([expect.stringContaining('sync-custom-enums.ts') as string])
        expect((await fs.readFile(initializerPath)).toString()).toEqual(
          initializerContents(`'./client/howyadoin/enums.ts', 'internal'`),
        )
      })

      it('leaves the existing file untouched when the prompt is declined', async () => {
        const confirm = vi.fn().mockResolvedValue(false)

        await generateSyncEnumsInitializer(
          './client/howyadoin/enums.ts',
          'sync-custom-enums.ts',
          'internal',
          { confirm },
        )

        expect((await fs.readFile(initializerPath)).toString()).toEqual(
          initializerContents(`'./client/howyadoin/enums.ts', 'mobile'`),
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
            generateSyncEnumsInitializer('./client/howyadoin/enums.ts', 'sync-custom-enums.ts', 'internal', {
              confirm,
            }),
          ).rejects.toThrow(/EACCES/)

          expect(confirm).not.toHaveBeenCalled()
          await fs.chmod(initializerPath, 0o600)
          expect((await fs.readFile(initializerPath)).toString()).toEqual(
            initializerContents(`'./client/howyadoin/enums.ts', 'mobile'`),
          )
        })
      })

      it('fails loudly instead of silently choosing when the prompt is bypassed', async () => {
        // BYPASS_CLI_PROMPT=1 (set for this suite) would short-circuit
        // cliPrompt to '', so the default confirm must throw rather than
        // treating that as an answer
        await expect(
          generateSyncEnumsInitializer('./client/howyadoin/enums.ts', 'sync-custom-enums.ts', 'internal'),
        ).rejects.toThrow(CannotConfirmOverwriteError)

        expect((await fs.readFile(initializerPath)).toString()).toEqual(
          initializerContents(`'./client/howyadoin/enums.ts', 'mobile'`),
        )
      })
    })
  })
})
