import GenerateCLIProgram from 'src/cli/program/generate'
import File from 'src/helpers/file'
import config from 'src/config'

const generateCLIProgram = new GenerateCLIProgram()

const expectedSliceTemplate = `\
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import TestUserAPI from 'psy/net/testapi/v1/test-user'

export const createTestUser = createAsyncThunk(
  'testapi/v1/test-users#create',
  async attributes => await TestUserAPI.create(attributes),
)

export const deleteTestUser = createAsyncThunk(
  'testapi/v1/test-users#delete',
  async opts => await TestUserAPI.delete(id),
)

export const indexTestUser = createAsyncThunk(
  'testapi/v1/test-users#index',
  async opts => await TestUserAPI.index(opts),
)

export const showTestUser = createAsyncThunk(
  'testapi/v1/test-users#show',
  async id => await TestUserAPI.show(id),
)

export const updateTestUser = createAsyncThunk(
  'testapi/v1/test-users#update',
  async (id, attributes) => await TestUserAPI.update(id, attributes),
)

const initialState = {
  testUser: {
    id: null,
    email: null,
  },
  index: [],
}

const testUserSlice = createSlice({
  name: 'testUser',
  initialState,
  reducers: {
    update(state, attributes) {
      state.testUser = {
        ...state.testUser,
        ...attributes,
      }
    },
    set(state, testUser) {
      state.testUser = testUser
    },
    push(state, testUser) {
      state.index.push(testUser)
    },
    delete(state, id) {
      state.index = [
        ...state.index.filter(testUser => testUser.id !== id),
      ]
    },
    truncate(state, id) {
      state.index = []
    },
  },
  extraReducers: builder => {
    builder.addCase(createTestUser.fulfilled, (state, action) => {
      state.testUser = {
        ...state.testUser,
        ...action.payload,
      }
    })

    builder.addCase(deleteTestUser.fulfilled, (state, action) => {
      state.index.find(testUser => testUser.id === action.payload.id)
      if (state.testUser.id === action.payload.id)
        state.testUser = initialState.testUser
    })

    builder.addCase(indexTestUser.fulfilled, (state, action) => {
      state.index.push(action.payload)
    })

    builder.addCase(showTestUser.fulfilled, (state, action) => {
      state.index.push(action.payload)
    })

    builder.addCase(updateTestUser.fulfilled, (state, action) => {
      state.testUser = {
        ...state.testUser,
        ...action.payload,
      }
    })
  },
})

export const { update, set, push, delete, truncate } = testUserSlice.actions
export default testUserSlice.reducer
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
    const file = await File.read('tmp/spec/psy/slices/testapi/v1/test-user.js')
    expect(file.toString()).toEqual(expectedSliceTemplate)
  })
})

