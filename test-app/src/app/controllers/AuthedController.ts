import { BeforeAction, PsychicController } from '../../../../src/index.js'
import User from '../models/User.js'

export default class AuthedController extends PsychicController {
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
