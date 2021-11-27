import Psyclass from 'src/psychic/psyclass'
import { parseRoute } from 'src/helpers/route'

class Route extends Psyclass {
  get fullRoute() {
    return `${this.prefix}/${this.route}`
  }

  get namespaceSegments() {
    let pathSegments = this.segments
      .filter(segment => !/^:/.test(segment))

    // pop method from path
    pathSegments.pop()

    // if it belongs to a resource, path should segment both method and resource name,
    // so that /api/v1/users/auth
    // becomes /api/v1
    if (this.belongsToResource)
      pathSegments.pop()

    return pathSegments
  }

  get namespace() {
    return this.namespaceSegments.join('/')
  }

  get resourceName() {
    if (!this.isResource) return null
    const resourceName = this.channel?.assumedDreamClass?.resourceName
    if (resourceName) return resourceName
    return this.unnamedSegments.last
  }

  get parsedRoute() {
    return parseRoute(this.fullRoute)
  }

  get parsed() {
    return this.parsedRoute
  }

  get routeKey() {
    return `${this.httpMethod}:${this.parsedRoute.key}`
  }

  get hasUriSegments() {
    return this.uriSegments.any
  }

  get segments() {
    return this.parsed.segments
  }

  get uriSegments() {
    return this.segments
      .filter(segment => /^:/.test(segment))
      .map(segment => segment.replace(/^:/, ''))
  }

  get unnamedSegments() {
    return this.segments.filter(segment => !/^:/.test(segment))
  }

  constructor(httpMethod, route, channel, method, {
    authKey,
    belongsToResource,
    isResource,
    isWS,
    prefix,
  }={}) {
    super()
    this.authKey = authKey
    this.belongsToResource = belongsToResource
    this.channel = channel
    this.httpMethod = httpMethod
    this._isResource = isResource
    this.isResource = isResource
    this.isWS = isWS
    this.method = method
    this.prefix = prefix
    this.route = route
  }
}

export default Route
