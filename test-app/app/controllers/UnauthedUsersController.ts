import User from '../models/User'
import ApplicationController from './ApplicationController'

export default class UnauthedUsersController extends ApplicationController {
  public async signin() {
    const email = this.castParam('email', 'string')
    const password = this.castParam('password', 'string')

    const user = await User.findBy({ email })
    if (!user) return this.unauthorized()

    const validPassword = await user.checkPassword(password)
    if (!validPassword) return this.unauthorized()

    this.setCookie('auth_token', user.id.toString())
    this.noContent()
  }
}
