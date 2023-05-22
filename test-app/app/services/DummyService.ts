import backgroundedService from '../../../src/background/backgrounded-service'
import User from '../models/User'

export default class DummyService extends backgroundedService(__filename) {
  public static runInBG() {
    User.backgroundTest()
  }
}
