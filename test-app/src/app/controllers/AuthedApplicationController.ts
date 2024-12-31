import { BeforeAction, PsychicController } from '../../../../src'
import User from '../models/User'

export default class AuthedApplicationController extends PsychicController {
  protected currentUser: User

  @BeforeAction()
  public async authenticate() {
    const userId = this.getCookie<string>('auth_token')
    if (!userId) return this.unauthorized()

    const user = await User.find(userId)
    if (!user) return this.unauthorized()

    this.currentUser = user!
  }
}
