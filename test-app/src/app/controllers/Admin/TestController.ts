import { OpenAPI } from '../../../../../src.js'
import AdminBaseController from './BaseController.js'

export default class AdminTestController extends AdminBaseController {
  @OpenAPI({
    status: 200,
  })
  public test() {
    this.ok('howyadoin')
  }
}
