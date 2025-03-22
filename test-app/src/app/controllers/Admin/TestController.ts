import { OpenAPI } from '../../../../../src/index.js'
import AdminAuthedController from './AuthedController.js'

export default class AdminTestController extends AdminAuthedController {
  @OpenAPI({
    status: 200,
  })
  public test() {
    this.ok('howyadoin')
  }
}
