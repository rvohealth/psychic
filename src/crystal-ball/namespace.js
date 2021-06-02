import jwt from 'jsonwebtoken'
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
    this._givenType = null
    this._givenKey = null

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

  get givenType() {
    return this._givenType
  }

  get givenKey() {
    return this._givenKey
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
    const channelParamName = paramCase(this.channelName.replace(/Channel$/, ''))
    opts.authKey = authKey
    return this.post('auth', `${channelParamName}#auth`, opts)
  }

  delete(route, path, opts) {
    return this.run('delete', route, path, opts)
  }

  given(givenStr, cb) {
    const [ givenType, givenKey ] = givenStr.split(':')
    this._givenType = givenType
    this._givenKey = givenKey
    cb(this)
    this._givenType = null
    this._givenKey = null
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

  addRouteForChannel(route, httpMethod, channel, method, { authKey, _isResource }={}) {
    const fullRoute = `${this.prefix}/${route}`
    const parsedRoute = parseRoute(fullRoute)
    const key = `${httpMethod}:${parsedRoute.key}`
    const routeObj = {
      route,
      httpMethod,
      channel,
      method,
      parsed: parsedRoute,
      isResource: _isResource,
      authKey,
    }

    this._routes[key] = routeObj

    if (authKey)
      config.registerAuthKey(authKey, routeObj)

    const { givenType, givenKey } = this
    this.app[httpMethod](fullRoute, async (req, res) => {
      const vision = new Vision(route, method, req, res)
      const channelInstance = new channel(vision)

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

      // add error handling here
       try {
         await channelInstance[method]()
       } catch(error) {
         if (error.constructor.statusCode) {
           return res.status(error.constructor.statusCode).send(error.message)
         }

         if (process.env.CORE_TEST)
           throw error

         return res.status(500).send("Whoops, Something went wrong...")
       }
    })
  }

  parseStringPath(path) {
    const [ channelNameRaw, method ] = path.split('#')
    const channelName = pascalCase(channelNameRaw)
    const channel = config.channels[channelName]?.default
    if (!channel) throw `Missing channel for route ${path} (expected ${channelName})`

    return {
      type: 'string',
      channel,
      method: camelCase(method),
    }
  }
}
