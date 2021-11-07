import CrystalBall from 'src/crystal-ball'
import config from 'src/config'
import transports from 'src/singletons/transports'
import Boot from 'src/psychic/boot'

export default class Psychic {
  get crystalBall() {
    return this._crystalBall
  }

  constructor() {
    this._crystalBall = new CrystalBall()
  }

  async boot(prefix=null) {
    await new Boot(prefix).boot()
  }

  async gaze() {
    await this.crystalBall.gaze()
  }

  seek(cb) {
    cb(this.crystalBall)
  }

  async message(transportKey, opts) {
    return transports.send(transportKey, opts)
  }
}
