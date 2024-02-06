import ApplicationController from './ApplicationController'

export default class ErrorsController extends ApplicationController {
  public throwConflict() {
    this.conflict()
  }
}
