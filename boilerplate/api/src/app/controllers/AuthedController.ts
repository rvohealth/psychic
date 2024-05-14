import {
  PsychicController,
  BeforeAction,
  // Encrypt,
} from '@rvohealth/psychic'
// import User from '../models/User'

export default class AuthedController extends PsychicController {
  // protected currentUser: User
  @BeforeAction()
  public async authenticate() {
    throw `TODO: Implement authentication scheme!`
    // implement an authentication pattern that ends with you setting
    // this.currentUser to a user. i.e.
    // const token = this.req.headers['token'] as string
    // const userId = Encrypt.decode(token)
    // const user = await User.find(userId)
    // if (!user) return this.forbidden()
    // this.currentUser = await User.find(userId)
  }
}
