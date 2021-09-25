import jwt from 'jsonwebtoken'
import pluralize from 'pluralize'
import pascalCase from 'src/helpers/pascalCase'
import camelCase from 'src/helpers/camelCase'
import snakeCase from 'src/helpers/snakeCase'
import paramCase from 'src/helpers/paramCase'
import { parseRoute } from 'src/helpers/route'
import config from 'src/config'
import HTTPVision from 'src/crystal-ball/vision/http'
import l from 'src/singletons/l'
import Psyclass from 'src/psychic/psyclass'
import InvalidGivenType from 'src/error/crystal-ball/namespace/invalid-given-type'

import UnrecognizedRouteError from 'src/error/crystal-ball/namespace/unrecognized-route'

export default class Namespace extends Psyclass {
  constructor(routeKey, prefix, app, io, { belongsToResource }={}) {
    super()

    this._app = app
    this._io = io
    this._channels = {}
    this._namespaces = {}
    this._routeKey = routeKey
    this._routes = {}
    this._givenType = null
    this._givenKey = null
    this._belongsToResource = !!belongsToResource

    // handles default case where routeKey is null
    this._prefix = routeKey ?
      `${prefix}/${routeKey}` :
      prefix
  }

  static VALID_GIVEN_TYPES = [
    'auth',
  ]

  get app() {
    return this._app
  }

  get belongsToResource() {
    return this._belongsToResource
  }

  get channelName() {
    if (!this.routeKey) return null
    return pascalCase(pluralize(this.routeKey)) + 'Channel'
  }

  get givenType() {
    return this._givenType
  }

  get givenKey() {
    return this._givenKey
  }

  get io() {
    return this._io
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

  auth(authKey, opts={}) {
    const channelName = opts.channel || this.channelName.replace(/Channel$/, '')
    const channelParamName = paramCase(channelName)
    opts.authKey = authKey
    return this.post('auth', `${channelParamName}#auth`, opts)
  }

  delete(route, path, opts) {
    return this.run('delete', route, path, opts)
  }

  given(givenStr, cb) {
    const [ givenType, givenKey ] = givenStr.split(':')

    if (!this.constructor.VALID_GIVEN_TYPES.includes(givenType))
      throw new InvalidGivenType(givenType, givenKey)

    this.setCurrentGivenType(givenType, givenKey)
    cb(this)
    this.unsetCurrentGivenType()
  }

  get(route, path, opts) {
    return this.run('get', route, path, opts)
  }

  namespace(namespace) {
    this._namespaces[namespace.routeKey] = namespace
    return this
  }

  options(route, path, opts) {
    return this.run('options', route, path, opts)
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

  ws(route, path, opts) {
    return this.run('ws', route, path, { ...opts, isWS: true })
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

    if (cb) {
      const ns = new Namespace(pluralized, this.prefix, this.app, this.io, { belongsToResource: true })
      this.namespace(ns)
      return ns
    }

    return true
  }

  run(httpMethod, route, path, opts) {
    path = this.parsePath(path)

    switch(path.type) {
    case 'string':
      this.addRouteForChannel(httpMethod, route, path.channel, path.method, opts)
      break

    default:
      throw `unhandled path type for ${path}`
    }
    return this
  }

  // move these route helpers to class
  parsePath(path) {
    if (typeof path === 'string')
      return this.parseStringPath(path)
    throw `unrecognized path type ${path}`
  }

  addRouteForChannel(httpMethod, route, channel, method, { authKey, _isResource, isWS }={}) {
    const fullRoute = `${this.prefix}/${route}`
    const parsedRoute = parseRoute(fullRoute)
    const key = `${httpMethod}:${parsedRoute.key}`
    const routeObj = {
      route,
      fullRoute,
      httpMethod,
      channel,
      method,
      parsed: parsedRoute,
      belongsToResource: this.belongsToResource,
      isResource: _isResource,
      authKey,
      isWS,
    }

    this._routes[key] = routeObj

    if (authKey)
      config.registerAuthKey(authKey, routeObj)

    // eventually move this to crystal ball layer.
    if (!isWS)
      this._addHTTP(routeObj)
  }

  parseStringPath(path) {
    const [ channelNameRaw, method ] = path.split('#')
    const channelName = pascalCase(channelNameRaw)
    const channel = config.channels[channelName]?.default

    if (!channel)
      throw new UnrecognizedRouteError(path, channelName, method)

    return {
      type: 'string',
      channel,
      method: camelCase(method),
    }
  }

  setCurrentGivenType(givenType, givenKey) {
    this._givenType = givenType
    this._givenKey = givenKey
  }

  unsetCurrentGivenType() {
    this._givenType = null
    this._givenKey = null
  }

  _addHTTP(routeObj) {
    this.app[routeObj.httpMethod](routeObj.fullRoute, this._buildHTTPResponse(routeObj))
  }

  _buildHTTPResponse(routeObj) {
    const { givenType, givenKey } = this

    return async (req, res) => {
      const vision = new HTTPVision(routeObj.route, routeObj.method, req, res)
      const channelInstance = new routeObj.channel(vision)

      if (givenType) {
        let payload
        let DreamClass
        let dream
        switch(givenType) {
        case 'auth':
          if (!req.cookies[givenKey]) return res
            .status(401)
            .send(`Missing auth credentials for ${givenKey}`)

          payload = jwt.decode(req.cookies[givenKey], process.env.PSYCHIC_SECRET)
          if (!payload)
            return res.status(401).send(`Invalid credentials`)

          DreamClass = config.dream(payload.dreamClass)
          if (!DreamClass)
            return res.status(401).send(`Invalid credentials`)

          dream = await DreamClass.find(payload.id)
          if (!dream)
            return res.status(401).send(`Invalid credentials`)

          vision.setAuth(givenKey, dream)
          break

        default:
          throw `unrecognized given type ${givenType}`
        }
      }

      // main block where channels are connected to routes
      // add better error handling here
      try {
        await channelInstance[routeObj.method]()
      } catch(error) {
        l.error(`An error occurred: ${error.constructor.name}: ${error.message || error}`)

        if (error.constructor.statusCode)
          return res.status(error.constructor.statusCode).send(error.message)

        if (process.env.CORE_TEST)
          throw error

        return res.status(500).send('Whoops, Something went wrong...')
      }
    }
  }
}
