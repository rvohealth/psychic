import ApplicationController from './ApplicationController.js'

export default class ScopeTestController extends ApplicationController {
  public scopeTest() {
    this.ok('helloscopedworld')
  }
}
