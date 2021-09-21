import CrystalBall from 'src/crystal-ball'
import config from 'src/singletons/config'
import transports from 'src/singletons/transports'

export default class Psychic {
  get crystalBall() {
    return this._crystalBall
  }

  constructor() {
    this._crystalBall = new CrystalBall()
  }

  async gaze() {
    await this.crystalBall.gaze()
  }

  boot(...args) {
    return config.boot(...args)
  }

  seek(cb) {
    cb(this.crystalBall)
  }

  async message(transportKey, opts) {
    return transports.send(transportKey, opts)
  }
}
