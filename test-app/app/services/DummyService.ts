import backgroundedService from '../../../src/background/backgrounded-service'
import User from '../models/User'

export default class DummyService extends backgroundedService(__filename) {
  public static classRunInBG(arg: any) {
    User.backgroundTest()
  }

  public constructorArg: any
  constructor(arg: any) {
    super()
    this.constructorArg = arg
  }

  public instanceRunInBG(arg: any) {
    this.instanceMethodToTest(this.constructorArg, arg)
  }

  public instanceMethodToTest(a: any, b: any) {}
}
