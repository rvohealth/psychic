import GenerateCLIProgram from 'src/cli/program/generate'
import File from 'src/helpers/file'
import config from 'src/config'

const generateCLIProgram = new GenerateCLIProgram()

const expectedSliceTemplate = `\
import { createAsyncThunk, createSlice, createAction, PayloadAction } from '@reduxjs/toolkit'
import TestUserAPI from 'psy/net/test-user'

export const createTestUser = createAsyncThunk(
  'psy:test-users#create',
  async attributes => await TestUserAPI.create(attributes),
)

export const deleteTestUser = createAsyncThunk(
  'psy:test-users#delete',
  async opts => await TestUserAPI.delete(id),
)

export const indexTestUser = createAsyncThunk(
  'psy:test-users#index',
  async opts => await TestUserAPI.index(opts),
)

export const showTestUser = createAsyncThunk(
  'psy:test-users#show',
  async id => await TestUserAPI.show(id),
)

export const updateTestUser = createAsyncThunk(
  'psy:test-users#update',
  async (id, attributes) => await TestUserAPI.update(id, attributes),
)

const mergeAction = createAction('psy:test-users#merge')
const setAction = createAction('psy:test-users#set')
const pushAction = createAction('psy:test-users#push')
const filterAction = createAction('psy:test-users#filter')
const deleteAction = createAction('psy:test-users#delete')
const truncateAction = createAction('psy:test-users#truncate')

const initialState = {
  current: {
    id: null,
    email: null,
  },
  filter: {},
  index: [],
}

const testUserSlice = createSlice({
  name: 'testUser',
  initialState,
  reducers: {
    merge(state, attributes) {
      state.current = {
        ...state.current,
        ...attributes,
      }
    },
    set(state, testUser) {
      state.current = testUser
    },
    push(state, testUser) {
      state.index.push(testUser)
    },
    filter(state, filter) {
      this.filter = {
        ...this.filter,
        ...filter,
      }
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
      state.current = {
        ...state.current,
        ...action.payload,
      }
    })

    builder.addCase(deleteTestUser.fulfilled, (state, action) => {
      state.index.find(testUser => testUser.id === action.payload.id)
      if (state.current.id === action.payload.id)
        state.current = initialState.current
    })

    builder.addCase(indexTestUser.fulfilled, (state, action) => {
      state.index.push(action.payload)
    })

    builder.addCase(showTestUser.fulfilled, (state, action) => {
      state.index.push(action.payload)
    })

    builder.addCase(updateTestUser.fulfilled, (state, action) => {
      state.current = {
        ...state.current,
        ...action.payload,
      }
      state.index = state.index.map(testUser => testUser.id === action.payload.id ? action.payload : testUser)
    })

    builder.addCase(mergeAction, (state, action) => {
      state.current = {
        ...state.current,
        ...action.payload,
      }
    })

    builder.addCase(setAction, (state, action) => {
      state.current = action.payload
    })

    builder.addCase(pushAction, (state, action) => {
      state.index.push(action.payload)
    })

    builder.addCase(filterAction, (state, action) => {
      this.filter = {
        ...this.filter,
        ...action.payload,
      }
    })

    builder.addCase(deleteAction, (state, action) => {
      state.index = [
        ...state.index.filter(testUser => testUser.id !== action.payload),
      ]
    })

    builder.addCase(truncateAction, state => {
      state.index = []
    })
  },
})

export const { update, set, push, delete, filter, truncate } = testUserSlice.actions
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
    const file = await File.read('tmp/spec/psy/slices/test-user.js')
    expect(file.toString()).toEqual(expectedSliceTemplate)
  })
})

