import ApplicationController from '../application'

export default class ApiUsersController extends ApplicationController {
  public ping() {
    this.ok('hellonestedworld')
  }
}
