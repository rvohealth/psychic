import PsychicController from '../../../../src/controller'

export default class ApiUsersController extends PsychicController {
  public ping() {
    this.ok('hellonestedworld')
  }
}
