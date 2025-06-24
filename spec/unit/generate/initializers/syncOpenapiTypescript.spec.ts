import fs from 'node:fs/promises'
import generateSyncOpenapiTypescriptInitializer from '../../../../src/generate/initializer/syncOpenapiTypescript.js'

describe('generateSyncOpenapiTypescriptInitializer', () => {
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
    expect(contents).toEqual(`\
import { DreamCLI } from '@rvoh/dream'
import { PsychicApp } from "@rvoh/psychic"
import AppEnv from '../AppEnv.js'

export default (psy: PsychicApp) => {
  psy.on('cli:sync', async () => {
    if (AppEnv.isDevelopmentOrTest) {
      DreamCLI.logger.logStartProgress(\`[sync-openapi-typescript] extracting types from ./openapi.json to ./sync-custom-openapi-typescript.d.ts...\`)
      await DreamCLI.spawn('npx openapi-typescript ./openapi.json -o ./sync-custom-openapi-typescript.d.ts')
      DreamCLI.logger.logEndProgress()
    }
  })
}`)
  })
})
