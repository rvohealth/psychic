import ApplicationController from '../../application'

export default class ApiV1UsersController extends ApplicationController {
  public ping() {
    this.ok('hellodoublenestedworld')
  }
}
