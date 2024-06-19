import User from '../models/User'
import ApplicationController from './ApplicationController'

export default class ErrorsController extends ApplicationController {
  public throwConflict() {
    this.conflict()
  }

  public async throwNotFound() {
    await User.findOrFail('999999999')
    this.ok()
  }
}
