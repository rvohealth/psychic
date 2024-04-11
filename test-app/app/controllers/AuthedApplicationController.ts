import { BeforeAction } from '../../../src'
import PsychicController from '../../../src/controller'
import User from '../models/User'

export default class AuthedApplicationController extends PsychicController {
  public user: User

  @BeforeAction()
  public authenticate() {
    if (!this.user) this.unauthorized()
  }
}
