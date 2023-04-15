import PsychicController from '../../../../../src/controller'

export default class ApiV1UsersController extends PsychicController {
  public ping() {
    this.ok('hellodoublenestedworld')
  }
}
