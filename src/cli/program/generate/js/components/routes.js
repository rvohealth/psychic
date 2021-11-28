import path from 'path'
import config from 'src/config'

// NOTE: this file generates client routes by scanning routes on server
// (it is not a file that generates backend routes)
export default class GenerateRoutes {
  static async generate(routes, opts={}) {
    const routeObject = buildRouteObject(routes)
    const template =
`\
export default {
${routeString(routeObject)}
}
`
    const filePath = opts.path || path.join(config.psyJsPath, 'routes.js')
    await File.overwrite(path.join(filePath), template)
  }
}

function routeString(routeObject, spaces=[]) {
  spaces.push('  ')
  const str =
`\
${
  Object
    .keys(routeObject)
    .map( segment => {
      if (routeObject[segment].constructor === RouteStringWriter) {
        return `${spaces.join('')}${segment}: ${routeObject[segment].toString()}`
      } else {
        return `${spaces.join('')}${segment}: {
${routeString(routeObject[segment], [...spaces])}\n` +
          `${spaces.join('')}},`
      }
    })
    .join("\n")
}\
`
  return str
}

function buildRouteObject(routes) {
  const result = {}
  let currentSpot = result
  routes.forEach(route => {
    if (route.prefix.presence) {
      const segments = route.prefix.split('/').compact({ removeBlank: true })
      segments.forEach((segment, index) => {
        currentSpot[segment] ||= {}

        if (index === segments.length - 1) {
          const resourceName = route.resourceName?.camelize().pluralize()
          if (route.isResource && resourceName) {
            const _isLastRouteForResource = isLastRouteForResource(route, routes)
            currentSpot[segment][resourceName] ||= {}
            currentSpot[segment][resourceName][route.method] = new RouteStringWriter(route, {
              index,
              isLastRoute: _isLastRouteForResource
            })
          } else {
            currentSpot[segment][route.method] =
              new RouteStringWriter(route, { index })
          }

        } else currentSpot = currentSpot[segment]
      })
      currentSpot = result

    } else {
      const resourceName = route.resourceName?.camelize()?.pluralize()
      if (route.isResource && resourceName) {
        const _isLastRouteForResource = isLastRouteForResource(route, routes)
        result[resourceName] ||= {}
        result[resourceName][route.method] = new RouteStringWriter(route, {
          index: 0,
          isLastRoute: _isLastRouteForResource,
        })
      } else {
        result[route.method] =
          new RouteStringWriter(route, { index: 0 })
      }
    }
  })

  return result
}

function isLastRouteForResource(route, routes) {
  let lastRouteForResource = null
  routes.forEach(_route => {
    if (_route.prefix === route.prefix) {
      lastRouteForResource = _route
    }
  })

  return lastRouteForResource === route
}

class RouteStringWriter {
  get resourceName() {
    return this.route.channel.assumedDreamClass.resourceName.camelize()
  }

  get shouldAddExtraClosingTag() {
    return this.route.isResource
  }

  constructor(route, { index, isLastRoute }) {
    this.route = route
    this.index = index
    this.isLastRoute = isLastRoute
  }

  toString() {
    let str = ''
    if (this.route.hasUriSegments) {
      if (this.route.uriSegments.length === 1) {
        str = `${this.route.uriSegments.first} => ${this.routeString()}`
      } else {
        str = `(${this.route.uriSegments.join(', ')}) => ${this.routeString()}`
      }
    } else {
      str = `'${this.route.fullRoute.replace(/^\//, '')}'`
    }

    str = str + ','
    return str
  }

  routeString() {
    let routeString = `\`${this.route.fullRoute.replace(/^\//, '')}\``
    this.route.uriSegments.forEach(segment => {
      routeString = routeString.replace(new RegExp(`:${segment}`), `$\{${segment}}`)
    })
    return routeString
  }
}
