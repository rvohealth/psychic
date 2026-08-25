import { DreamCLI } from '@rvoh/dream/system'
import fs from 'node:fs/promises'
import { MockInstance } from 'vitest'
import { CannotConfirmOverwriteError } from '../../../../src/cli/helpers/confirmOverwrite.js'
import generateOpenapiReduxBindings from '../../../../src/generate/openapi/reduxBindings.js'

describe('generateOpenapiReduxBindings', () => {
  let dreamCliSpy: MockInstance

  const jsonPath = './test-app/src/conf/openapi/myApi.openapi-codegen.json'
  const apiFilePath = 'test-client/app/api/api.ts'
  const initializerPath = 'test-app/src/conf/initializers/openapi/myApi.ts'

  const fullOptions = {
    exportName: 'myApi',
    schemaFile: './src/openapi/openapi.json',
    apiFile: apiFilePath,
    apiImport: 'emptyMyApi',
    outputFile: 'test-client/app/api/myApi.ts',
  }

  // differs from fullOptions in the codegen JSON (schemaFile + apiImport) and
  // in the api file scaffold (apiImport); the initializer depends only on
  // exportName, so it stays byte-identical across these two runs
  const changedOptions = {
    ...fullOptions,
    schemaFile: './src/openapi/admin.openapi.json',
    apiImport: 'emptyAdminApi',
  }

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
      await fs.rm('./test-app/src/conf/openapi', { recursive: true })
    } catch {
      // noop
    }

    for (const initializerFilename of ['myApi.ts', 'testappApi.ts']) {
      try {
        await fs.rm(`./test-app/src/conf/initializers/openapi/${initializerFilename}`)
      } catch {
        // noop
      }
    }

    // the default apiFile ('../client/app/api/api.ts') is written outside this
    // repo by the minimal-args cases; remove it so a leftover copy can never
    // trip the overwrite confirmation on later runs
    try {
      await fs.rm('../client/app/api/api.ts')
    } catch {
      // noop
    }

    try {
      await fs.rm('./test-client', { recursive: true })
    } catch {
      // noop
    }
  }

  context('openapi-codegen.json file', () => {
    context('with minimal args provided', () => {
      it('creates a conf/openapi-codegen.json file to configure the codegen tool, providing sensible defaults for all fields', async () => {
        await generateOpenapiReduxBindings()

        const openapiJson = JSON.parse(
          (await fs.readFile('./test-app/src/conf/openapi/testappApi.openapi-codegen.json')).toString(),
        ) as object

        expect(openapiJson).toEqual({
          schemaFile: '../../../src/openapi/openapi.json',
          apiFile: '../../../../client/app/api/api.ts',
          outputFile: '../../../../client/app/api/testappApi.ts',
          apiImport: 'emptyTestappApi',
          exportName: 'testappApi',
          hooks: true,
        })
      })
    })

    context('when explicitly passed values', () => {
      it('creates a conf/openapi-codegen.json file to configure the codegen tool, padding the file paths with the appropriate amount of updirs', async () => {
        await generateOpenapiReduxBindings({
          exportName: 'myApi',
          schemaFile: './src/openapi/admin.openapi.json',
          apiFile: './test-client/app/api/api.ts',
          apiImport: 'emptySplitApi',
          outputFile: './test-client/app/api/wellos-central.ts',
        })

        const openapiJson = JSON.parse((await fs.readFile(jsonPath)).toString()) as object

        expect(openapiJson).toEqual({
          schemaFile: '../../../src/openapi/admin.openapi.json',
          apiFile: '../../../test-client/app/api/api.ts',
          outputFile: '../../../test-client/app/api/wellos-central.ts',
          apiImport: 'emptySplitApi',
          exportName: 'myApi',
          hooks: true,
        })
      })
    })
  })

  context('apiFile, apiFileImport', () => {
    context('the apiFile does not exist', () => {
      it('generates a default one', async () => {
        await generateOpenapiReduxBindings({
          apiFile: 'test-client/app/api/api.ts',
          apiImport: 'chalupasDujour',
        })

        const contents = (await fs.readFile('./test-client/app/api/api.ts')).toString()

        expect(contents).toEqual(`\
// Or from '@reduxjs/toolkit/query' if not using the auto-generated hooks
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
// import { RootState } from '../store' // update this to the correct path to your app's store

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

// initialize an empty api service that we'll inject endpoints into later as needed
export const chalupasDujour = createApi({
  // forces cache to bust any time a component is mounted
  refetchOnMountOrArgChange: true,
  keepUnusedDataFor: 0,

  baseQuery: fetchBaseQuery({
    baseUrl: baseUrl(),
    credentials: 'include',

    // we recommend that you use a function like this for preparing
    // headers, so that you can make sure any necessary auth tokens
    // used by your app can be applied to the headers when any requests
    // are made to your backend api.
    // prepareHeaders: (headers, { getState }) => {
    //   return new Promise(resolve => {
    //     function checkToken() {
    //       const token = (getState() as RootState).app.authToken
    //       if (token) {
    //         headers.set('Authorization', \`Bearer \${token}\`)
    //         resolve(headers)
    //       } else {
    //         setTimeout(checkToken, 500) // try again in 500ms
    //       }
    //     }
    //     checkToken()
    //   })
    // },
  }),
  endpoints: () => ({}),
})\
`)
      })
    })

    context('the apiFile already exists with user customizations', () => {
      beforeEach(async () => {
        await fs.mkdir('test-client/app/api', { recursive: true })
        await fs.writeFile('test-client/app/api/api.ts', 'hello world')
      })

      it('keeps every file untouched when the overwrite prompt is declined (no file is written before the prompt)', async () => {
        const confirm = vi.fn().mockResolvedValue(false)

        await generateOpenapiReduxBindings(fullOptions, { confirm })

        expect(confirm).toHaveBeenCalledWith(['test-client/app/api/api.ts'])
        expect((await fs.readFile('./test-client/app/api/api.ts')).toString()).toEqual('hello world')
        // the codegen JSON (written first, unconditionally, before this change)
        // must not have been created either
        await expect(fs.access(jsonPath)).rejects.toThrow()
        await expect(fs.access(initializerPath)).rejects.toThrow()
      })

      it('overwrites the customized scaffold when the prompt is confirmed', async () => {
        const confirm = vi.fn().mockResolvedValue(true)

        await generateOpenapiReduxBindings(fullOptions, { confirm })

        const contents = (await fs.readFile('./test-client/app/api/api.ts')).toString()
        expect(contents).toContain('export const emptyMyApi = createApi({')
      })
    })
  })

  context('psychic initializer', () => {
    it('generates a psychic initializer to conduct the openapi sync', async () => {
      await generateOpenapiReduxBindings({
        exportName: 'myApi',
        apiFile: 'test-client/app/api/api.ts',
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
        await DreamCLI.spawn('pnpm', {
          args: ["exec","rtk-query-codegen-openapi","src/conf/openapi/myApi.openapi-codegen.json"],
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

  context('re-running with different settings (same target identities)', () => {
    beforeEach(async () => {
      await generateOpenapiReduxBindings({ ...fullOptions })
    })

    it('prompts once, listing every existing file that differs, and the new settings win everywhere on confirmation', async () => {
      const confirm = vi.fn().mockResolvedValue(true)

      await generateOpenapiReduxBindings({ ...changedOptions }, { confirm })

      expect(confirm).toHaveBeenCalledTimes(1)
      expect(confirm).toHaveBeenCalledWith([
        expect.stringContaining('myApi.openapi-codegen.json') as string,
        'test-client/app/api/api.ts',
      ])

      const openapiJson = JSON.parse((await fs.readFile(jsonPath)).toString()) as Record<string, unknown>
      expect(openapiJson['schemaFile']).toEqual('../../../src/openapi/admin.openapi.json')
      expect(openapiJson['apiImport']).toEqual('emptyAdminApi')

      const apiFileContents = (await fs.readFile(apiFilePath)).toString()
      expect(apiFileContents).toContain('export const emptyAdminApi = createApi({')
    })

    it('leaves ALL files untouched when the prompt is declined, and skips the follow-on package install', async () => {
      const confirm = vi.fn().mockResolvedValue(false)
      dreamCliSpy.mockClear()

      await generateOpenapiReduxBindings({ ...changedOptions }, { confirm })

      const openapiJson = JSON.parse((await fs.readFile(jsonPath)).toString()) as Record<string, unknown>
      expect(openapiJson['schemaFile']).toEqual('../../../src/openapi/openapi.json')
      expect(openapiJson['apiImport']).toEqual('emptyMyApi')

      const apiFileContents = (await fs.readFile(apiFilePath)).toString()
      expect(apiFileContents).toContain('export const emptyMyApi = createApi({')

      expect(dreamCliSpy).not.toHaveBeenCalled()
    })

    it('silently no-ops without prompting when every file is byte-identical', async () => {
      const confirm = vi.fn()
      const jsonBefore = (await fs.readFile(jsonPath)).toString()

      await generateOpenapiReduxBindings({ ...fullOptions }, { confirm })

      expect(confirm).not.toHaveBeenCalled()
      expect((await fs.readFile(jsonPath)).toString()).toEqual(jsonBefore)
    })

    it('fails loudly before any write instead of silently choosing when the prompt is bypassed', async () => {
      // BYPASS_CLI_PROMPT=1 (set for this suite) would short-circuit cliPrompt
      // to '', so the default confirm must throw rather than treating that as
      // an answer
      await expect(generateOpenapiReduxBindings({ ...changedOptions })).rejects.toThrow(
        CannotConfirmOverwriteError,
      )

      const openapiJson = JSON.parse((await fs.readFile(jsonPath)).toString()) as Record<string, unknown>
      expect(openapiJson['schemaFile']).toEqual('../../../src/openapi/openapi.json')
      expect(openapiJson['apiImport']).toEqual('emptyMyApi')
    })
  })

  context('@rtk-query/codegen-openapi package', () => {
    it('adds the @rtk-query/codegen-openapi package as a dev dependency', async () => {
      await generateOpenapiReduxBindings({
        exportName: 'myApi',
        apiFile: 'test-client/app/api/api.ts',
      })

      expect(dreamCliSpy).toHaveBeenCalledWith('pnpm', {
        args: ['add', '-D', '@rtk-query/codegen-openapi', 'ts-node'],
      })
    })
  })
})
