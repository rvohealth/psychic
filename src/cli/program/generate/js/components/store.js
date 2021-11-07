import path from 'path'
import config from 'src/config'

export default class GenerateStore {
  static async generate(routes) {
    const uniqRoutes = routes
      .uniq(route => `${route.prefix}:${route.channel.name.hyphenize()}`)
      .filter(route => route.isResource)

    const storePaths = buildStorePaths(uniqRoutes)

    const template =
`\
import { nestedCombineReducers } from 'nested-combine-reducers'
${
  uniqRoutes
    .map(route => reducerImportString(route))
    .join("\n")
}

export default nestedCombineReducers({
${routeReducerString(storePaths)}\
})
`
    const filePath = path.join(config.psyJsPath, 'store.js')
    await File.write(path.join(filePath), template)
  }
}

function reducerImportString(route) {
  return `import ${reducerName(route)} from 'psy${route.prefix}/${route.channel.resourceName}'`
}

function routeReducerString(storePaths, spaces=[]) {
  spaces.push('  ')
  let currPath = storePaths
  const closingTags = []
  const str =
`\
${
  Object
    .keys(storePaths)
    .map( segment => {

      if (currPath[segment].constructor === ReducerStringWriter) {
        return currPath[segment].toString(spaces)
      } else {
        currPath = currPath[segment]
        closingTags.push('}')
        return `${spaces.join('')}${segment}: {
${routeReducerString(currPath, spaces)}`
      }
    })
    .join("\n")
}\
${
  closingTags
    .map(tag => {
      spaces.pop()
      const str = `${spaces.join('')}${tag},`
      return str
    })
    .join("\n")
}
`
  return str
}

function reducerName(route) {
  return `${
    route
      .prefix
      .split('/')
      .join('_')
      .pascalize()
  }${route.channel.resourceName.pascalize()}`
}

function buildStorePaths(routes) {
  const result = {}
  let currentSpot = result
  routes.forEach(route => {
    if (route.prefix.presence) {
      const segments = route.prefix.split('/').compact({ removeBlank: true })
      segments.forEach((segment, index) => {
        currentSpot[segment] ||= {}

        if (index === segments.length - 1)
          currentSpot[segment][route.channel.assumedDreamClass.resourceName] =
            new ReducerStringWriter(route, { index })

        else {
          currentSpot = currentSpot[segment]
        }
      })

    } else {
      result[route.channel.assumedDreamClass.resourceName] = new ReducerStringWriter(route, { index: 0 })
    }
  })

  return result
}

class ReducerStringWriter {
  get resourceName() {
    return this.route.channel.assumedDreamClass.resourceName.camelize()
  }

  constructor(route, { index }) {
    this.route = route
    this.index = index
  }

  toString(spaces) {
    return `${spaces.join('')}${this.resourceName.pluralize()}: ${reducerName(this.route)}Reducer,`
  }
}
