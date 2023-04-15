import HowlController from '../../../../src/controller'

export default class ApiUsersController extends HowlController {
  public ping() {
    this.ok('hellonestedworld')
  }
}
