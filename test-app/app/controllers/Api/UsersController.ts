import { OpenAPI } from '../../../../src'
import User from '../../models/User'
import ApplicationController from '../ApplicationController'

export default class ApiUsersController extends ApplicationController {
  public ping() {
    this.ok('hellonestedworld')
  }

  @OpenAPI(() => User, {
    status: 204,
  })
  public async create() {
    await User.create(this.paramsFor(User))
    this.noContent()
  }

  @OpenAPI(() => User, { status: 204 })
  public async update() {
    const user = await User.findOrFail(this.castParam('id', 'bigint'))
    await user.update(this.paramsFor(User))
    this.noContent()
  }
}
