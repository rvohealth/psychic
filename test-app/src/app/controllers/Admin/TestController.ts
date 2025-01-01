import { OpenAPI } from '../../../../../src'
import AdminBaseController from './BaseController'

export default class AdminTestController extends AdminBaseController {
  @OpenAPI({
    status: 200,
  })
  public test() {
    this.ok('howyadoin')
  }
}
