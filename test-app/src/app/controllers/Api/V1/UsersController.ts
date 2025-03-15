import ApplicationController from '../../ApplicationController.js'

export default class ApiV1UsersController extends ApplicationController {
  public ping() {
    this.ok('hellodoublenestedworld')
  }

  public index() {
    this.ok('nested users index')
  }
}
