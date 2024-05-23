import ApplicationController from './ApplicationController'

export default class ParamsTestController extends ApplicationController {
  public testCastParam() {
    this.castParam('testString', 'string')
    this.noContent()
  }
}
