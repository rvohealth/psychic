import { DreamCLI } from '@rvoh/dream/system'
import fs from 'node:fs/promises'
import { MockInstance } from 'vitest'
import generateOpenapiZustandBindings from '../../../../src/generate/openapi/zustandBindings.js'

describe('generateOpenapiZustandBindings', () => {
  let dreamCliSpy: MockInstance

  beforeAll(() => {
    process.env.BYPASS_CLI_PROMPT = '1'
  })

  beforeEach(async () => {
    dreamCliSpy = vi.spyOn(DreamCLI, 'spawn').mockResolvedValue(undefined)
    await cleanup()
  })

  afterEach(async () => {
    await cleanup()
  })

  async function cleanup() {
    try {
      await fs.rm('./test-app/src/conf/initializers/openapi', { recursive: true })
    } catch {
      // noop
    }

    try {
      await fs.rm('./test-client', { recursive: true })
    } catch {
      // noop
    }
  }

  context('api client file', () => {
    context('the file does not exist', () => {
      it('generates a typed openapi-fetch client file', async () => {
        await generateOpenapiZustandBindings({
          exportName: 'myApi',
          outputDir: 'test-client/src/api',
          typesFile: 'test-client/src/api/myApi.types.d.ts',
        })

        const contents = (await fs.readFile('./test-client/src/api/myApi.ts')).toString()

        expect(contents).toEqual(`\
import createClient from 'openapi-fetch'
import type { paths } from './myApi.types.js'

function baseUrl() {
  // add custom code here for determining your application's baseUrl
  // this would generally be something different, depending on if you
  // are in dev/test/production environments. For dev, you might want
  // http://localhost:7777, while test may be http://localhost:7778, or
  // some other port, depending on how you have your spec hooks configured.
  // for production, it should be the real host for your application, i.e.
  // https://myapi.com

  return 'http://localhost:7777'
}

export const myApi = createClient<paths>({
  baseUrl: baseUrl(),
  credentials: 'include',

  // you may customize headers here, for example to add auth tokens:
  // headers: {
  //   Authorization: \`Bearer \${getAuthToken()}\`,
  // },
})
`)
      })
    })

    context('the file already exists', () => {
      beforeEach(async () => {
        await fs.mkdir('test-client/src/api', { recursive: true })
        await fs.writeFile('test-client/src/api/myApi.ts', 'hello world')
      })

      it('does not regenerate it', async () => {
        await generateOpenapiZustandBindings({
          exportName: 'myApi',
          outputDir: 'test-client/src/api',
          typesFile: 'test-client/src/api/myApi.types.d.ts',
        })

        const contents = (await fs.readFile('./test-client/src/api/myApi.ts')).toString()
        expect(contents).toEqual('hello world')
      })
    })
  })

  context('with minimal args provided', () => {
    it('generates files with sensible defaults', async () => {
      await generateOpenapiZustandBindings()

      const contents = (await fs.readFile('../client/src/api/testappApi.ts')).toString()
      expect(contents).toContain("export const testappApi = createClient<paths>")
    })

    afterEach(async () => {
      try {
        await fs.rm('../client', { recursive: true })
      } catch {
        // noop
      }
    })
  })

  context('psychic initializer', () => {
    it('generates a psychic initializer to conduct the openapi types sync', async () => {
      await generateOpenapiZustandBindings({
        exportName: 'myApi',
        schemaFile: './src/openapi/openapi.json',
        outputDir: 'test-client/src/api',
        typesFile: 'test-client/src/api/myApi.types.d.ts',
      })

      const contents = (await fs.readFile('test-app/src/conf/initializers/openapi/myApi.ts')).toString()
      expect(contents).toEqual(`\
import { DreamCLI } from '@rvoh/dream/system'
import { PsychicApp } from '@rvoh/psychic'
import AppEnv from '../../AppEnv.js'

export default function initializeMyApi(psy: PsychicApp) {
  psy.on('cli:sync', async () => {
    if (AppEnv.isDevelopmentOrTest) {
      DreamCLI.logger.logStartProgress(\`[myApi] syncing openapi types...\`)
      await DreamCLI.spawn('npx openapi-typescript ./src/openapi/openapi.json -o test-client/src/api/myApi.types.d.ts', {
        onStdout: message => {
          DreamCLI.logger.logContinueProgress(\`[myApi]\` + ' ' + message, {
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

  context('openapi-fetch and openapi-typescript packages', () => {
    it('adds them as dev dependencies', async () => {
      await generateOpenapiZustandBindings({
        exportName: 'myApi',
        outputDir: 'test-client/src/api',
        typesFile: 'test-client/src/api/myApi.types.d.ts',
      })

      expect(dreamCliSpy).toHaveBeenCalledWith('pnpm add -D openapi-fetch openapi-typescript')
    })
  })
})
