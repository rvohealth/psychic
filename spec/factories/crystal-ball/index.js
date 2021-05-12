import { buildVision } from 'spec/factories/crystal-ball/vision'

export default class CrystalBallFactory {
  static get vision() {
    return {
      build: buildVision,
    }
  }
}
