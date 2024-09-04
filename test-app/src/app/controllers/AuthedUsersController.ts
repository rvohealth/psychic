import AuthedApplicationController from './AuthedApplicationController'

export default class AuthedUsersController extends AuthedApplicationController {
  public ping() {
    this.ok('helloworld')
  }
}
