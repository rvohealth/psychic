import { execSync } from 'child_process'
import {
  createHttpTerminator,
} from 'http-terminator'
import fs from 'fs'
import WebSocket from 'ws'
import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import config from 'src/config'
import Namespace from 'src/crystal-ball/namespace'
import l from 'src/singletons/l'

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

  get wss() {
    return this._wss
  }

  constructor() {
    this._channels = {}
    this._app = express()
    this.app.use(cookieParser())
    this.app.use(express.json())

    if (process.env.CORE_TEST)
      this.app.use(cors({
        credentials: true,
      }))

    this._cachedNamespaces = []
    this._setCurrentNamespace(new Namespace(null, '', this._app))
  }

  async gaze(port) {
    await this.boot()
    this._server = this.app.listen(port || config.port, () => {
      if (!process.env.CORE_TEST)
        l.log('express connected')
    })
    this._serverKiller = createHttpTerminator({
      server: this.server,
    })

    this._wss = new WebSocket.Server({ port: config.wssPort })
    this._wss.on('connection', (ws, request, client) => {
      console.log('CONNECTED')
      this._wsss = ws
      ws.on('message', msg => {
        console.log(request)
        console.log(`Received message ${msg} from user ${client}`)
      })
    })

    process.on('SIGTERM', async () => {
      await this.closeConnection()
    })
  }

  closeWS() {
    return new Promise(accept => {
      if (!this._wss) return accept()
      for(const client of this._wss.clients) {
        client.close()
      }
      this._wss?.close(() => {
        accept()
      })
    })
  }

  async closeConnection() {
    await this.serverKiller.terminate()
    await this.closeWS()
    return true
  }

  async boot() {
    // this loads routes from user
    if (fs.existsSync('app'))
      await import('dist/boot/app/crystal-ball')
    // else
    //   throw 'Only meant for use with real app'
      // await import('dist/boot/crystal-ball')

    if (config.routeCB)
      config.routeCB(this)
  }

  namespace(namespace, cb) {
    console.log("NEW NAMESPACE", namespace)
    const ns = new Namespace(namespace, this.currentNamespace.prefix, this.app)
    this._setCurrentNamespace(ns)
    this.currentNamespace.namespace(namespace)
    cb(this)
    this._unsetCurrentNamespace()
    return this
  }

  auth(authKey, opts) {
    return this.currentNamespace.auth(authKey, opts)
  }

  delete(route, path, opts) {
    return this.currentNamespace.delete(route, path, opts)
  }

  given(givenStr, cb) {
    return this.currentNamespace.given(givenStr, cb)
  }

  get(route, path, opts) {
    return this.currentNamespace.get(route, path, opts)
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

  _setCurrentNamespace(namespace) {
    this._cachedNamespaces.push(namespace)
  }

  _unsetCurrentNamespace() {
    this._cachedNamespaces.pop()
  }
}
