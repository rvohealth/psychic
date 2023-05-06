import ApplicationController from '../ApplicationController'

export default class ApiUsersController extends ApplicationController {
  public ping() {
    this.ok('hellonestedworld')
  }
}
