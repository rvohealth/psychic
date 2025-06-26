import { BeforeAction, PsychicController } from '../../../../src/index.js'
import User from '../models/User.js'

export default class PassportAuthedController extends PsychicController {
  protected currentUser: User

  @BeforeAction()
  public authenticate() {
    const user = this.req.user as User
    if (!user) return this.unauthorized()
    this.currentUser = user!
  }

  public testPassportAuth() {
    this.ok({ id: this.currentUser.id })
  }
}
