import fs from 'node:fs/promises'
import generateOpenapiReduxBindings from '../../../../src/generate/openapi/reduxBindings.js'
import { MockInstance } from 'vitest'
import { DreamCLI } from '@rvoh/dream'

describe('generateOpenapiReduxBindings', () => {
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
      await fs.rm('./test-app/src/conf/openapi', { recursive: true })
    } catch {
      // noop
    }

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

        const openapiJson = JSON.parse(
          (await fs.readFile('./test-app/src/conf/openapi/myApi.openapi-codegen.json')).toString(),
        ) as object

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

    context('the apiFile already exists', () => {
      beforeEach(async () => {
        await fs.mkdir('test-client/app/api', { recursive: true })
        await fs.writeFile('test-client/app/api/api.ts', 'hello world')
      })

      it('does not regenerate it', async () => {
        await generateOpenapiReduxBindings({
          apiFile: 'test-client/app/api/api.ts',
        })

        const contents = (await fs.readFile('./test-client/app/api/api.ts')).toString()
        expect(contents).toEqual('hello world')
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
import { DreamCLI } from '@rvoh/dream'
import { PsychicApp } from '@rvoh/psychic'
import AppEnv from '../../AppEnv.js'

export default function initializeMyApi(psy: PsychicApp) {
  psy.on('cli:sync', async () => {
    if (AppEnv.isDevelopmentOrTest) {
      DreamCLI.logger.logStartProgress(\`[myApi] syncing...\`)
      await DreamCLI.spawn('npx @rtk-query/codegen-openapi src/conf/openapi/myApi.openapi-codegen.json', {
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

  context('@rtk-query/codegen-openapi package', () => {
    it('adds the @rtk-query/codegen-openapi package as a dev dependency', async () => {
      await generateOpenapiReduxBindings({
        exportName: 'myApi',
        apiFile: 'test-client/app/api/api.ts',
      })

      expect(dreamCliSpy).toHaveBeenCalledWith('yarn add -D @rtk-query/codegen-openapi ts-node')
    })
  })
})
