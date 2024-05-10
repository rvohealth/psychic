import { BeforeAction, Encrypt } from '../../../src'
import PsychicController from '../../../src/controller'
import User from '../models/User'

export default class AuthedApplicationController extends PsychicController {
  protected currentUser: User

  @BeforeAction()
  public async authenticate() {
    const cookie = this.cookie('auth_token')
    if (!cookie) return this.unauthorized()

    const userId = Encrypt.decode(cookie)
    const user = await User.find(userId)
    if (!user) return this.unauthorized()

    this.currentUser = user!
  }
}
