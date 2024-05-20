import { PsychicController, BeforeAction } from '@rvohealth/psychic'
// import User from '../models/User'

export default class AuthedController extends PsychicController {
  // protected currentUser: User
  @BeforeAction()
  public async authenticate() {
    throw `TODO: Implement authentication scheme!`
    // implement an authentication pattern that ends with you setting
    // this.currentUser to a user. i.e.:

    // const userId = this.getCookie('token')
    // const user = await User.find(userId)
    // if (!user) return this.unauthorized()

    // this.currentUser = user
  }
}
