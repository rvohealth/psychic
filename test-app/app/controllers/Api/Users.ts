import ApplicationController from '../Application'

export default class ApiUsersController extends ApplicationController {
  public ping() {
    this.ok('hellonestedworld')
  }
}
