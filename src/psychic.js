import CrystalBall from 'src/crystal-ball'
import config from 'src/config'

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
}
