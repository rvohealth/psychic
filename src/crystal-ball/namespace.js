import pluralize from 'pluralize'
import pascalCase from 'src/helpers/pascalCase'
import camelCase from 'src/helpers/camelCase'
import snakeCase from 'src/helpers/snakeCase'
import paramCase from 'src/helpers/paramCase'
import { parseRoute } from 'src/helpers/route'
import config from 'src/config'
import Vision from 'src/crystal-ball/vision'

export default class Namespace {
  constructor(routeKey, prefix, app) {
    this._app = app
    this._channels = {}
    this._namespaces = {}
    this._routeKey = routeKey
    this._routes = {}

    // handles default case where routeKey is null
    this._prefix = routeKey ?
      `${prefix}/${routeKey}` :
      prefix
  }

  get app() {
    return this._app
  }

  get channelName() {
    if (!this.routeKey) return null
    return pascalCase(pluralize(this.routeKey)) + 'Channel'
  }

  get namespaces() {
    return this._namespaces
  }

  get prefix() {
    return this._prefix
  }

  get resourceMethods() {
    return ['create', 'update', 'show', 'index', 'delete']
  }

  get routeKey() {
    return this._routeKey
  }

  get routes() {
    return Object
      .values(this._routes)
      .concat(
        Object
          .values(this.namespaces)
          .map(namespace => namespace.routes)
          .flat()
      )
  }

  auth(opts={}) {
    const channelParamName = paramCase(this.channelName.replace(/Channel$/, ''))
    return this.post('auth', `${channelParamName}#auth`, opts)
  }

  delete(route, path, opts) {
    return this.run('delete', route, path, opts)
  }

  get(route, path, opts) {
    return this.run('get', route, path, opts)
  }

  namespace(namespace, cb) {
    const ns = new Namespace(namespace, this.prefix, this.app)
    this._namespaces[namespace] = ns
    cb(ns)
    return this
  }

  patch(route, path, opts) {
    return this.run('patch', route, path, opts)
  }

  post(route, path, opts) {
    return this.run('post', route, path, opts)
  }

  put(route, path, opts) {
    return this.run('put', route, path, opts)
  }

  resource(resourceName, { only, except }={}, cb=null) {
    only = only || this.resourceMethods
    except = except || []

    const channelName = snakeCase(resourceName)
    const pluralized = pluralize(snakeCase(resourceName).replace('_', '-'))
    const resourcePath = `${pluralized}/:id`
    const collectionPath = pluralized

    if (only.includes('index') && !except.includes('index'))
      this.get(collectionPath, `${channelName}#index`, { _isResource: true })

    if (only.includes('show') && !except.includes('show'))
      this.get(resourcePath, `${channelName}#show`, { _isResource: true })

    if (only.includes('create') && !except.includes('create'))
      this.post(collectionPath, `${channelName}#create`, { _isResource: true })

    if (only.includes('update') && !except.includes('update'))
      this.put(resourcePath, `${channelName}#update`, { _isResource: true })

    if (only.includes('update') && !except.includes('update'))
      this.patch(resourcePath, `${channelName}#update`, { _isResource: true })

    if (only.includes('delete') && !except.includes('delete'))
      this.delete(resourcePath, `${channelName}#delete`, { _isResource: true })

    if (cb)
      this.namespace(pluralized, cb)
  }

  run(httpMethod, route, path, opts) {
    path = this.parsePath(path)
    switch(path.type) {
    case 'string':
      this.addRouteForChannel(route, httpMethod, path.channel, path.method, opts)
      break

    default:
      throw `unhandled path type for ${path}`
    }
    return this
  }

  // move these route helpers to class
  parsePath(path) {
    if (typeof path === 'string') return this.parseStringPath(path)
    throw `unrecognize path type ${path}`
  }

  addRouteForChannel(route, httpMethod, channel, method, { _isResource }={}) {
    const fullRoute = `${this.prefix}/${route}`
    const parsedRoute = parseRoute(fullRoute)
    const key = `${httpMethod}:${parsedRoute.key}`
    this._routes[key] = {
      route,
      httpMethod,
      channel,
      method,
      parsed: parsedRoute,
      isResource: _isResource,
    }

    this.app[httpMethod](fullRoute, async (req, res) => {
      const vision = new Vision(route, method, req, res)

      // add error handling here
      await new channel(vision)[method]()
    })
  }

  parseStringPath(path) {
    const [ channel, method ] = path.split('#')
    const channelName = pascalCase(channel)
    return {
      type: 'string',
      channel: config.channels[channelName].default,
      method: camelCase(method),
    }
  }
}
