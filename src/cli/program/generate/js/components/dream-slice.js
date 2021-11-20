import path from 'path'
import config from 'src/config'

export default class GenerateSignInComponent {
  static async generate(dreamName, { attributes, namespace, routes }) {
    const prefix = routePrefix(dreamName, { namespace })
    const template =
`\
import { createAsyncThunk, createSlice, createAction, PayloadAction } from '@reduxjs/toolkit'
import ${dreamName.pascalize()}API from 'psy/net${namespace.presence ? namespace : ''}/${dreamName.pluralize().hyphenize()}'

${
  routes
    .uniq(r => r.method)
    .alpha('method')
    .map(route => routeThunk(dreamName, { route, namespace }))
    .join("\n")
}
const mergeAction = createAction('psy:${prefix}#merge')
const setAction = createAction('psy:${prefix}#set')
const pushAction = createAction('psy:${prefix}#push')
const filterAction = createAction('psy:${prefix}#filter')
const removeAction = createAction('psy:${prefix}#remove')
const truncateAction = createAction('psy:${prefix}#truncate')

const initialState = {
  current: {
${
  Object
    .keys(attributes)
    .map(key => attributeString(key, attributes[key]))
    .compact()
    .join("\n")
}
  },
  filter: {},
  index: [],
}

const ${dreamName.camelize()}Slice = createSlice({
  name: '${dreamName.camelize()}',
  initialState,
  reducers: {
    merge(state, attributes) {
      state.current = {
        ...state.current,
        ...attributes,
      }
    },
    set(state, ${dreamName.camelize()}) {
      state.current = ${dreamName.camelize()}
    },
    push(state, ${dreamName.camelize()}) {
      state.index.push(${dreamName.camelize()})
    },
    filter(state, filter) {
      this.filter = {
        ...this.filter,
        ...filter,
      }
    },
    remove(state, id) {
      state.index = [
        ...state.index.filter(${dreamName.camelize()} => ${dreamName.camelize()}.id !== id),
      ]
    },
    truncate(state, id) {
      state.index = []
    },
  },
  extraReducers: builder => {
${
  routes
    .uniq(r => r.method)
    .alpha('method')
    .map(route => thunkResponse(dreamName, route))
    .join("\n")
    .replace(/\n$/, '')}

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

    builder.addCase(removeAction, (state, action) => {
      state.index = [
        ...state.index.filter(${dreamName.camelize()} => ${dreamName.camelize()}.id !== action.payload),
      ]
    })

    builder.addCase(truncateAction, state => {
      state.index = []
    })
  },
})

export const { update, set, push, remove, filter, truncate } = ${dreamName.camelize()}Slice.actions
export default ${dreamName.camelize()}Slice.reducer
`
    const filePath = path.join(config.psyJsPath, 'slices', namespace)
    await Dir.mkdirUnlessExists(filePath, { recursive: true })
    await File.write(path.join(filePath, `${dreamName.hyphenize()}.js`), template)
  }
}

function attributeString(key, value) {
  const str = `    ${key}: ${value},`
  return str
}

function routeThunk(dreamName, { route, namespace }) {
  const prefix = 'psy:' + routePrefix(dreamName, { namespace })

  return do {
    switch(route.method) {
    case 'create':
`\
export const create${dreamName.pascalize()} = createAsyncThunk(
  '${prefix}#create',
  async attributes => await ${dreamName.pascalize()}API.create(attributes),
)
`
      break

    case 'update':
`\
export const update${dreamName.pascalize()} = createAsyncThunk(
  '${prefix}#update',
  async (id, attributes) => await ${dreamName.pascalize()}API.update(id, attributes),
)
`
      break

    case 'index':
`\
export const index${dreamName.pascalize()} = createAsyncThunk(
  '${prefix}#index',
  async opts => await ${dreamName.pascalize()}API.index(opts),
)
`
      break

    case 'show':
`\
export const show${dreamName.pascalize()} = createAsyncThunk(
  '${prefix}#show',
  async id => await ${dreamName.pascalize()}API.show(id),
)
`
      break

    case 'remove':
`\
export const delete${dreamName.pascalize()} = createAsyncThunk(
  '${prefix}#delete',
  async opts => await ${dreamName.pascalize()}API.delete(id),
)
`
      break
    }
  }
}

function thunkResponse(dreamName, route) {
  return do {
    switch(route.method) {
    case 'create':
`\
    builder.addCase(create${dreamName.pascalize()}.fulfilled, (state, action) => {
      state.current = {
        ...state.current,
        ...action.payload,
      }
    })
`
      break

    case 'update':
`\
    builder.addCase(update${dreamName.pascalize()}.fulfilled, (state, action) => {
      state.current = {
        ...state.current,
        ...action.payload,
      }
      state.index = state.index.map(${dreamName.camelize()} => ${dreamName.camelize()}.id === action.payload.id ? action.payload : ${dreamName.camelize()})
    })
`
      break

    case 'index':
`\
    builder.addCase(index${dreamName.pascalize()}.fulfilled, (state, action) => {
      state.index.push(action.payload)
    })
`
      break

    case 'show':
`\
    builder.addCase(show${dreamName.pascalize()}.fulfilled, (state, action) => {
      state.index.push(action.payload)
    })
`
      break

    case 'delete':
`\
    builder.addCase(delete${dreamName.pascalize()}.fulfilled, (state, action) => {
      state.index.find(${dreamName.camelize()} => ${dreamName.camelize()}.id === action.payload.id)
      if (state.current.id === action.payload.id)
        state.current = initialState.current
    })
`
      break
    }
  }
}

function routePrefix(dreamName, { namespace }) {
  return path
    .join(...[namespace.presence, dreamName.pluralize().hyphenize()].compact())
    .replace(/^\//, '')
}

// const MyComponent = () => {
//   const firstName = useSelector(state => state.psy.testapp.v1.testUsers.current.firstName)

//   return (
//     <Psy.Form
//       for='testapp.v1.testUsers.current'
//     >
//       <Psy.Input for='firstName' />
//     </Psy.Form>
//   )
// }
