import fs from 'fs'
import express from 'express'
import config from 'src/config'
import Namespace from 'src/crystal-ball/namespace'
import l from 'src/singletons/l'

export default class CrystalBall {
  static get routes() {
    const crystalBall = new CrystalBall()
    config.routeCB(crystalBall.namespace)
    return crystalBall.routes
  }

  static get namespaces() {
    const crystalBall = new CrystalBall()
    config.routeCB(crystalBall.namespace)
    return crystalBall.namespaces
  }

  get app() {
    return this._app
  }

  get routes() {
    return this.namespace.routes
  }

  get channels() {
    return config.channels
  }

  get namespace() {
    return this._namespace
  }

  get namespaces() {
    return this.namespace.namespaces
  }

  constructor() {
    this._channels = {}
    this._app = express()
    this._namespace = new Namespace(null, '', this._app)
  }

  async gaze() {
    await this.boot()
    this.app.listen(config.port, () => {
      l.log('express connected')
    })
  }

  async boot() {
    // this loads routes from user
    if (fs.existsSync('app'))
      await import('dist/boot/app/crystal-ball')
    else
      throw 'Only meant for use with real app'
      // await import('dist/boot/crystal-ball')

    if (config.routeCB)
      config.routeCB(this.namespace)
  }
}
