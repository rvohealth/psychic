import fs from 'node:fs/promises'
import generateSyncEnumsInitializer from '../../../../src/generate/initializer/syncEnums.js'

describe('generateSyncEnumsInitializer', () => {
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
      await fs.rm('./test-app/src/conf/initializers/sync-enums.ts')
    } catch {
      // noop
    }

    try {
      await fs.rm('./test-app/src/conf/initializers/sync-custom-enums.ts')
    } catch {
      // noop
    }
  }

  it('generates a psychic initializer to conduct the enum sync', async () => {
    await generateSyncEnumsInitializer('./client/howyadoin/enums.ts', 'sync-custom-enums.ts')

    const contents = (await fs.readFile('test-app/src/conf/initializers/sync-custom-enums.ts')).toString()
    expect(contents).toEqual(`\
import { DreamCLI } from '@rvoh/dream'
import { PsychicApp } from '@rvoh/psychic'
import AppEnv from '../AppEnv.js'

export default function syncCustomEnums(psy: PsychicApp) {
  psy.on('sync', async () => {
    if (AppEnv.isDevelopmentOrTest) {
      DreamCLI.logger.logStartProgress(\`[syncCustomEnums] syncing enums to ./client/howyadoin/enums.ts...\`)
      await DreamCLI.spawn('yarn psy sync:client:enums ./client/howyadoin/enums.ts', {
        onStdout: message => {
          DreamCLI.logger.logContinueProgress(\`[syncCustomEnums]\` + ' ' + message, {
            logPrefixColor: 'green',
          })
        },
      })
      DreamCLI.logger.logEndProgress()
    }
  })
}`)
  })
})
