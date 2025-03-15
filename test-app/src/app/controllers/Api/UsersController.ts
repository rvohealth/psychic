import { OpenAPI } from '../../../../../src/index.js'
import User from '../../models/User.js'
import ApplicationController from '../ApplicationController.js'

export default class ApiUsersController extends ApplicationController {
  public ping() {
    this.ok('hellonestedworld')
  }

  @OpenAPI(User, {
    status: 204,
  })
  public async create() {
    await User.create(this.paramsFor(User))
    this.noContent()
  }

  @OpenAPI(User, { status: 204 })
  public async update() {
    const user = await User.findOrFail(this.castParam('id', 'bigint'))
    await user.update(this.paramsFor(User))
    this.noContent()
  }
}
