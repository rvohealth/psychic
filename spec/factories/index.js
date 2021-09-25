import ExpressFactory from 'spec/factories/express'
import CrystalBallFactory from 'spec/factories/crystal-ball'
import DreamFactory from 'spec/factories/dream'

class Factories {
  static get dream() {
    return DreamFactory
  }

  static get express() {
    return ExpressFactory
  }

  static get crystalBall() {
    return CrystalBallFactory
  }
}

export const create = function(type, ...args) {
  const factory = type
    .split('.')
    // TODO: add various casing support
    .reduce((_factory, _type) => _factory[_type], Factories) // eventually add error handling here...

  if (!factory?.build) throw 'Factory not found: ' + type

  return factory.build(...args)
}

export default Factories
