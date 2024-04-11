import ApplicationController from './ApplicationController'

export default class ScopeTestController extends ApplicationController {
  public scopeTest() {
    this.ok('helloscopedworld')
  }
}
