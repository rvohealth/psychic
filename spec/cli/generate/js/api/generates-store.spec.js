import GenerateCLIProgram from 'src/cli/program/generate'
import File from 'src/helpers/file'
import config from 'src/config'

const generateCLIProgram = new GenerateCLIProgram()

const expectedStoreTemplate = `\
import { nestedCombineReducers } from 'nested-combine-reducers'
import TestUsers from 'psy/test-users'
import TestapiV1TestUsers from 'psy/testapi/v1/test-users'

export default nestedCombineReducers({
  testUsers: TestUsersReducer,
  testapi: {
    v1: {
      testUsers: TestapiV1TestUsersReducer,
    },
  },
})
`

describe('cli program g:api', () => {
  beforeEach(() => {
    posess(config, 'schema', 'get').returning({
      test_users: {
        id: {
          name: 'id',
          type: 'int',
        },
        email: {
          name: 'email',
          type: 'text',
        },
      }
    })
  })

  it ('generates a new slice with the correct path and contents', async () => {
    await generateCLIProgram.run({ command: 'js', args: [] })
    const file = await File.text('tmp/spec/psy/store.js')
    expect(file).toEqual(expectedStoreTemplate)
  })
})

