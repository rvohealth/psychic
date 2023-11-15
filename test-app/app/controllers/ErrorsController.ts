import ApplicationController from './ApplicationController'

export default class UsersController extends ApplicationController {
  public throwConflict() {
    this.conflict()
  }
}
