import ApplicationController from './ApplicationController'

export default class GreeterController extends ApplicationController {
  public show() {
    this.ok('must go on')
  }

  public hello() {
    this.ok('goodbye')
  }
}
