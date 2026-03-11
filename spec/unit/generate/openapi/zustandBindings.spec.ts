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

  context('clientConfigFile', () => {
    context('the clientConfigFile does not exist', () => {
      it('generates a client config file that configures @hey-api/client-fetch', async () => {
        await generateOpenapiZustandBindings({
          clientConfigFile: 'test-client/app/api/myApi/client.ts',
        })

        const contents = (await fs.readFile('./test-client/app/api/myApi/client.ts')).toString()

        expect(contents).toEqual(`\
import { client } from '@hey-api/client-fetch'

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

client.setConfig({
  baseUrl: baseUrl(),
  credentials: 'include',

  // you can customize headers here, for example to add auth tokens:
  // headers: {
  //   Authorization: \`Bearer \${getToken()}\`,
  // },
})`)
      })
    })

    context('the clientConfigFile already exists', () => {
      beforeEach(async () => {
        await fs.mkdir('test-client/app/api/myApi', { recursive: true })
        await fs.writeFile('test-client/app/api/myApi/client.ts', 'hello world')
      })

      it('does not regenerate it', async () => {
        await generateOpenapiZustandBindings({
          clientConfigFile: 'test-client/app/api/myApi/client.ts',
        })

        const contents = (await fs.readFile('./test-client/app/api/myApi/client.ts')).toString()
        expect(contents).toEqual('hello world')
      })
    })
  })

  context('psychic initializer', () => {
    it('generates a psychic initializer to run @hey-api/openapi-ts on sync', async () => {
      await generateOpenapiZustandBindings({
        exportName: 'myApi',
        schemaFile: './src/openapi/openapi.json',
        outputDir: '../client/app/api/myApi',
        clientConfigFile: 'test-client/app/api/myApi/client.ts',
      })

      const contents = (await fs.readFile('test-app/src/conf/initializers/openapi/myApi.ts')).toString()
      expect(contents).toEqual(`\
import { DreamCLI } from '@rvoh/dream/system'
import { PsychicApp } from '@rvoh/psychic'
import AppEnv from '../../AppEnv.js'

export default function initializeMyApi(psy: PsychicApp) {
  psy.on('cli:sync', async () => {
    if (AppEnv.isDevelopmentOrTest) {
      await DreamCLI.logger.logProgress(\`[myApi] syncing...\`, async () => {
        await DreamCLI.spawn('npx @hey-api/openapi-ts -i ./src/openapi/openapi.json -o ../client/app/api/myApi', {
          onStdout: message => {
            DreamCLI.logger.logContinueProgress(\`[myApi]\` + ' ' + message, {
              logPrefixColor: 'green',
            })
          },
        })
      })
    }
  })
}`)
    })
  })

  context('@hey-api/openapi-ts package', () => {
    it('adds the @hey-api/openapi-ts and @hey-api/client-fetch packages as dev dependencies', async () => {
      await generateOpenapiZustandBindings({
        exportName: 'myApi',
        clientConfigFile: 'test-client/app/api/myApi/client.ts',
      })

      expect(dreamCliSpy).toHaveBeenCalledWith('pnpm add -D @hey-api/openapi-ts @hey-api/client-fetch')
    })
  })
})
