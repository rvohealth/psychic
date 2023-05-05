import ApplicationController from '../../Application'

export default class ApiV1UsersController extends ApplicationController {
  public ping() {
    this.ok('hellodoublenestedworld')
  }
}
