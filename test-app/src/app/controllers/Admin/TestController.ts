import { OpenAPI } from '../../../../../src/index.js'
import AdminBaseController from './BaseController.js'

export default class AdminTestController extends AdminBaseController {
  @OpenAPI({
    status: 200,
  })
  public test() {
    this.ok('howyadoin')
  }
}
