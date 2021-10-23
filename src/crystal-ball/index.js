import io from 'socket.io'
import jwt from 'jsonwebtoken'
import morgan from 'morgan'
import {
  createHttpTerminator,
} from 'http-terminator'
import { createServer } from 'http'
import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import config from 'src/config'
import Namespace from 'src/crystal-ball/namespace'
import WSVision from 'src/crystal-ball/vision/ws'
import l from 'src/singletons/l'
import esp from 'src/esp'
import { emit } from 'src/helpers/ws'
import File from 'src/helpers/file'

export default class CrystalBall {
  static get routes() {
    const crystalBall = new CrystalBall()
    config.routeCB(crystalBall)
    return crystalBall.routes
  }

  static get namespaces() {
    const crystalBall = new CrystalBall()
    config.routeCB(crystalBall)
    return crystalBall.namespaces
  }

  get app() {
    return this._app
  }

  get routes() {
    return this.currentNamespace.routes
  }

  get channels() {
    return config.channels
  }

  get currentNamespace() {
    return this._cachedNamespaces[this._cachedNamespaces.length - 1]
  }

  get httpRoutes() {
    return this.routes
      .filter(r => !r.isWS)
  }

  get lastNamespace() {
    return this._cachedNamespaces[this._cachedNamespaces.length - 2]
  }

  get namespaces() {
    return this.currentNamespace.namespaces
  }

  get server() {
    return this._server
  }

  get serverKiller() {
    return this._serverKiller
  }

  get io() {
    return this._io
  }

  get ioServer() {
    return this._ioServer
  }

  get ioServerKiller() {
    return this._ioServerKiller
  }

  get wsRoutes() {
    return this.routes
      .filter(r => r.isWS)
  }

  constructor() {
    this._channels = {}
    this._app = express()

    const logPath = `log/${process.env.NODE_ENV}.crystalball.log`
    File.touch(logPath)

    this.app.use(morgan('combined', {
      stream: File.stream(logPath, { flags: 'a' }),
    }))

    this.app.use(cookieParser())
    this.app.use(express.json())

    this.app.use(cors({
      credentials: true,
      origin: '*'//config.frontEndUrl,
    }))

    this._ioServer = createServer((req, res) => {
      // Set CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Request-Method', '*');
      res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
      res.setHeader('Access-Control-Allow-Headers', '*');
      if ( req.method === 'OPTIONS' ) {
        res.writeHead(200);
        res.end();
        return;
      }
    })

    this._io = io(this.ioServer, {
      cors: {
        origin: config.frontEndUrl,
        methods: ["GET", "POST"],
        allowedHeaders: ['psy-auth-tokens'],
        credentials: true,
      }
    })

    this.io.on('connection', socket => {
      socket.psy = {
        auth: {},
      }

      this.wsRoutes.forEach(route => {
        socket.on(route.fullRoute.replace(/^\//, ''), async params => {
          const vision = new WSVision(route.route, route.method, params, { socket, io: this.io })
          const channelInstance = new route.channel(vision)

          // add error handling here
           try {
             await channelInstance[route.method]()
           } catch(error) {
             l.error(`An error occurred: ${error.constructor.name}: ${error.message || error}`)

             if (error.constructor.statusCode)
               throw `Socket Error: ${error.constructor.name} (${error.constructor.statusCode})`

             if (process.env.CORE_TEST)
               throw error

             throw `Whoops, something went wrong...`
           }
        })
      })

      socket.on('psy/auth', async ({ token, key }={}) => {
        if (!token) throw `Missing required token for WS token auth`
        if (!key) throw `Missing required key for WS token auth`

        const payload = jwt.decode(token, process.env.PSYCHIC_SECRET)
        if (!payload) throw 'Failed to identify auth token'

        const DreamClass = config.dream(payload.dreamClass)
        if (!DreamClass) throw 'Failed to identify auth token'

        const dream = await DreamClass.find(payload.id)
        if (!dream) throw `The resource attempting to auth with does not exist`

        socket.join(`auth:${key}:${dream.id}`)
        socket.psy.auth[key] = dream

        socket.emit('psy/authed')
      })

      esp.on('ws:to:authToken', ({ to, id, path, data }) => {
        // using emit helper also captures wildcard cases and emits to all sockets
        // with registered auth token (though currently the implementation needs work).
        emit(this.io, `auth:${to}:${id}`, path, data)
      })
    })

    this._ioServerKiller = createHttpTerminator({
      server: this.ioServer,
    })

    this._cachedNamespaces = []
    this._setCurrentNamespace(new Namespace(null, '', this.app, this.io))
  }

  async boot() {
    if (await File.exists('app'))
      await import('.dist/psychic/boot/app/crystal-ball')

    if (config.routeCB)
      config.routeCB(this)
  }

  async closeConnection() {
    await this.serverKiller.terminate()
    await this.ioServerKiller.terminate()
    return true
  }

  auth(authKey, opts) {
    return this.currentNamespace.auth(authKey, opts)
  }

  delete(route, path, opts) {
    return this.currentNamespace.delete(route, path, opts)
  }

  async gaze(port=config.port) {
    await this.boot()

    this._server = this.app.listen(port, () => {
      l.log(`express connected on port ${port}`)
    })

    this._serverKiller = createHttpTerminator({
      server: this.server,
    })

    this.ioServer.listen(config.wssPort, () => {
      l.log(`wss connected on port ${config.wssPort}`)
    })

    process.on('SIGTERM', async () => {
      l.log('shutting down server')
      await this.closeConnection()
    })
  }

  given(givenStr, cb) {
    return this.currentNamespace.given(givenStr, cb)
  }

  get(route, path, opts) {
    return this.currentNamespace.get(route, path, opts)
  }

  namespace(namespace, cb) {
    const ns = Namespace.new(namespace, this.currentNamespace.prefix, this.app, this.io)
    this.currentNamespace.namespace(ns)
    this._setCurrentNamespace(ns)
    cb(this)
    this._unsetCurrentNamespace()
    return this
  }

  options(route, path, opts) {
    return this.currentNamespace.options(route, path, opts)
  }

  patch(route, path, opts) {
    return this.currentNamespace.patch(route, path, opts)
  }

  post(route, path, opts) {
    return this.currentNamespace.post(route, path, opts)
  }

  put(route, path, opts) {
    return this.currentNamespace.put(route, path, opts)
  }

  resource(resourceName, opts, cb=null) {
    if (cb) {
      const namespace = this.currentNamespace.resource(resourceName, opts, cb)
      this._setCurrentNamespace(namespace)
      cb(this)
      this._unsetCurrentNamespace()

    } else {
      return this.currentNamespace.resource(resourceName, opts)
    }
  }

  transmit(authKey, id, messageKey, message) {
    this.io
      .to(`auth:${authKey}:${id}`)
      .emit(messageKey, message)
  }

  ws(route, path, opts) {
    return this.currentNamespace.ws(route, path, opts)
  }

  _setCurrentNamespace(namespace) {
    this._cachedNamespaces.push(namespace)
  }

  _unsetCurrentNamespace() {
    this._cachedNamespaces.pop()
  }
}
