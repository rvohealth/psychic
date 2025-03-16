import { BeforeAction } from '../../../../../../src/index.js'
import HelloController from '../HelloController.js'

export default class WorldController extends HelloController {
  @BeforeAction()
  public myBeforeAction() {
    this.imATeampot()
  }

  public world() {
    this.ok()
  }
}
