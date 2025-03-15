import { BeforeAction, PsychicController } from '../../../../src.js'
import User from '../models/User.js'

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
