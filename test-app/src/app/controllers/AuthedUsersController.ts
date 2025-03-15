import AuthedApplicationController from './AuthedApplicationController.js'

export default class AuthedUsersController extends AuthedApplicationController {
  public ping() {
    this.ok('helloworld')
  }
}
