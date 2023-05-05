import PsychicController from '../../../src/controller'
import User from '../models/User.x'

export default class ApplicationController extends PsychicController {
  public user: User
  public authenticate() {
    if (!this.user) this.unauthorized()
  }
}
