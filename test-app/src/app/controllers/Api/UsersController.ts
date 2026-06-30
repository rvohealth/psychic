import { OpenAPI } from '../../../../../src/package-exports/index.js'
import User, { userParamSafeColumns } from '../../models/User.js'
import ApplicationController from '../ApplicationController.js'

export default class ApiUsersController extends ApplicationController {
  public ping() {
    this.ok('hellonestedworld')
  }

  @OpenAPI(User, {
    fastJsonStringify: true,
    status: 204,
    requestBody: {
      params: userParamSafeColumns,
    },
  })
  public async create() {
    await User.create(this.paramsFor(User, { only: userParamSafeColumns }))
    this.noContent()
  }

  @OpenAPI(User, {
    status: 204,
    fastJsonStringify: true,
    requestBody: {
      params: userParamSafeColumns,
    },
  })
  public async update() {
    const user = await User.findOrFail(this.castParam('id', 'bigint'))
    await user.update(this.paramsFor(User, { only: userParamSafeColumns }))
    this.noContent()
  }
}
