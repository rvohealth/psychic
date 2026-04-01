import { DreamCLI } from '@rvoh/dream/system'
import fs from 'node:fs/promises'
import { MockInstance } from 'vitest'
import generateZustandStoreFromSdk from '../../../../src/generate/helpers/zustandBindings/generateStoreFromSdk.js'
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
      it('generates a client config file that configures the @hey-api/openapi-ts client', async () => {
        await generateOpenapiZustandBindings({
          clientConfigFile: 'test-client/app/api/myApi/client.ts',
        })

        const contents = (await fs.readFile('./test-client/app/api/myApi/client.ts')).toString()

        expect(contents).toEqual(`\
import { client } from './client.gen'

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
    it('generates a psychic initializer that runs @hey-api/openapi-ts and generates the zustand store on sync', async () => {
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
import { generateZustandStoreFromSdk } from '@rvoh/psychic/system'
import AppEnv from '../../AppEnv.js'

export default function initializeMyApi(psy: PsychicApp) {
  psy.on('cli:sync', async () => {
    if (AppEnv.isDevelopmentOrTest) {
      await DreamCLI.logger.logProgress(\`[myApi] syncing...\`, async () => {
        await DreamCLI.spawn('pnpm exec openapi-ts -i ./src/openapi/openapi.json -o ../client/app/api/myApi', {
          onStdout: message => {
            DreamCLI.logger.logContinueProgress(\`[myApi]\` + ' ' + message, {
              logPrefixColor: 'green',
            })
          },
        })
      })

      await DreamCLI.logger.logProgress(\`[myApi] generating zustand store...\`, async () => {
        await generateZustandStoreFromSdk('../client/app/api/myApi')
      })
    }
  })
}`)
    })

    context('when the initializer already exists without store generation', () => {
      beforeEach(async () => {
        await fs.mkdir('test-app/src/conf/initializers/openapi', { recursive: true })
        await fs.writeFile(
          'test-app/src/conf/initializers/openapi/myApi.ts',
          `\
import { DreamCLI } from '@rvoh/dream/system'
import { PsychicApp } from '@rvoh/psychic'
import AppEnv from '../../AppEnv.js'

export default function initializeMyApi(psy: PsychicApp) {
  psy.on('cli:sync', async () => {
    if (AppEnv.isDevelopmentOrTest) {
      await DreamCLI.logger.logProgress(\`[myApi] syncing...\`, async () => {
        await DreamCLI.spawn('pnpm exec openapi-ts -i ./src/openapi/openapi.json -o ../client/app/api/myApi', {
          onStdout: message => {
            DreamCLI.logger.logContinueProgress(\`[myApi]\` + ' ' + message, {
              logPrefixColor: 'green',
            })
          },
        })
      })
    }
  })
}`,
        )
      })

      it('regenerates the initializer to include store generation', async () => {
        await generateOpenapiZustandBindings({
          exportName: 'myApi',
          schemaFile: './src/openapi/openapi.json',
          outputDir: '../client/app/api/myApi',
          clientConfigFile: 'test-client/app/api/myApi/client.ts',
        })

        const contents = (await fs.readFile('test-app/src/conf/initializers/openapi/myApi.ts')).toString()
        expect(contents).toContain('generateZustandStoreFromSdk')
      })
    })

    context('when the initializer already exists and matches the expected output', () => {
      beforeEach(async () => {
        // first run to create the initializer
        await generateOpenapiZustandBindings({
          exportName: 'myApi',
          schemaFile: './src/openapi/openapi.json',
          outputDir: '../client/app/api/myApi',
          clientConfigFile: 'test-client/app/api/myApi/client.ts',
        })
      })

      it('does not regenerate it', async () => {
        const contentsBefore = (
          await fs.readFile('test-app/src/conf/initializers/openapi/myApi.ts')
        ).toString()

        await generateOpenapiZustandBindings({
          exportName: 'myApi',
          schemaFile: './src/openapi/openapi.json',
          outputDir: '../client/app/api/myApi',
          clientConfigFile: 'test-client/app/api/myApi/client.ts',
        })

        const contentsAfter = (
          await fs.readFile('test-app/src/conf/initializers/openapi/myApi.ts')
        ).toString()
        expect(contentsAfter).toEqual(contentsBefore)
      })
    })
  })

  context('@hey-api/openapi-ts package', () => {
    it('adds the @hey-api/openapi-ts package as a dev dependency', async () => {
      await generateOpenapiZustandBindings({
        exportName: 'myApi',
        clientConfigFile: 'test-client/app/api/myApi/client.ts',
      })

      expect(dreamCliSpy).toHaveBeenCalledWith('pnpm add -D @hey-api/openapi-ts')
    })
  })
})

describe('generateZustandStoreFromSdk', () => {
  const outputDir = 'test-client/app/api/myApi'

  beforeEach(async () => {
    await cleanup()
  })

  afterEach(async () => {
    await cleanup()
  })

  async function cleanup() {
    try {
      await fs.rm('./test-client', { recursive: true })
    } catch {
      // noop
    }
  }

  context('when sdk.gen.ts does not exist', () => {
    it('does nothing', async () => {
      await generateZustandStoreFromSdk(outputDir)

      await expect(fs.access(`${outputDir}/store.gen.ts`)).rejects.toThrow()
    })
  })

  context('when sdk.gen.ts has no exported functions', () => {
    beforeEach(async () => {
      await fs.mkdir(outputDir, { recursive: true })
      await fs.writeFile(`${outputDir}/sdk.gen.ts`, '// empty sdk')
    })

    it('does nothing', async () => {
      await generateZustandStoreFromSdk(outputDir)

      await expect(fs.access(`${outputDir}/store.gen.ts`)).rejects.toThrow()
    })
  })

  context('when sdk.gen.ts has exported functions', () => {
    beforeEach(async () => {
      await fs.mkdir(outputDir, { recursive: true })
      await fs.writeFile(
        `${outputDir}/sdk.gen.ts`,
        `\
export const getApiUsers = (options?: Options<GetApiUsersData>) => {
  return (options?.client ?? client).get<GetApiUsersResponse>({
    url: '/api/users',
  })
}

export const postApiUsers = (options: Options<PostApiUsersData>) => {
  return (options?.client ?? client).post<PostApiUsersResponse>({
    url: '/api/users',
    body: options.body,
  })
}

export const patchApiUsersById = (options: Options<PatchApiUsersByIdData>) => {
  return (options?.client ?? client).patch<PatchApiUsersByIdResponse>({
    url: '/api/users/{id}',
    path: { id: options.path.id },
    body: options.body,
  })
}`,
      )
    })

    it('generates store.gen.ts with a Zustand store hook for each SDK function', async () => {
      await generateZustandStoreFromSdk(outputDir)

      const contents = (await fs.readFile(`${outputDir}/store.gen.ts`)).toString()

      expect(contents).toContain("import { create } from 'zustand'")
      expect(contents).toContain("import * as sdk from './sdk.gen'")
      expect(contents).toContain('export const useGetApiUsers = createSdkStore(sdk.getApiUsers)')
      expect(contents).toContain('export const usePostApiUsers = createSdkStore(sdk.postApiUsers)')
      expect(contents).toContain('export const usePatchApiUsersById = createSdkStore(sdk.patchApiUsersById)')
    })

    it('includes the createSdkStore helper with state management', async () => {
      await generateZustandStoreFromSdk(outputDir)

      const contents = (await fs.readFile(`${outputDir}/store.gen.ts`)).toString()

      expect(contents).toContain('interface SdkStore<TData, TArgs extends unknown[]>')
      expect(contents).toContain('data: TData | undefined')
      expect(contents).toContain('error: unknown')
      expect(contents).toContain('isLoading: boolean')
      expect(contents).toContain('fetch: (...args: TArgs) => Promise<TData | undefined>')
      expect(contents).toContain('reset: () => void')
      expect(contents).toContain('function createSdkStore')
    })

    it('regenerates on each call (not skipped if exists)', async () => {
      await generateZustandStoreFromSdk(outputDir)

      // update sdk.gen.ts with a new function
      await fs.writeFile(
        `${outputDir}/sdk.gen.ts`,
        `\
export const getApiPets = (options?: Options<GetApiPetsData>) => {
  return (options?.client ?? client).get<GetApiPetsResponse>({
    url: '/api/pets',
  })
}`,
      )

      await generateZustandStoreFromSdk(outputDir)

      const contents = (await fs.readFile(`${outputDir}/store.gen.ts`)).toString()

      expect(contents).toContain('export const useGetApiPets = createSdkStore(sdk.getApiPets)')
      expect(contents).not.toContain('useGetApiUsers')
      expect(contents).not.toContain('usePostApiUsers')
    })
  })
})
