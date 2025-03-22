import AuthedController from './AuthedController.js'

export default class AuthedUsersController extends AuthedController {
  public ping() {
    this.ok('helloworld')
  }
}
