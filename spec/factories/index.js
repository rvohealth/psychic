import ExpressFactory from 'spec/factories/express'
import CrystalBallFactory from 'spec/factories/crystal-ball'

class Factories {
  static get express() {
    return ExpressFactory
  }

  static get crystalBall() {
    return CrystalBallFactory
  }
}

export const create = function(type, ...args) {
  return type
    .split('.')
    // add various casing support
    .reduce((_factory, _type) => _factory[_type], Factories) // eventually add error handling here...
    .build(...args)
}

export default Factories
