import { BeforeAction } from '../../../../../../src/index.js'
import HelloController from '../HelloController.js'

export default class WorldController extends HelloController {
  @BeforeAction()
  public override myBeforeAction() {
    this.imATeampot()
  }

  public world() {
    this.ok()
  }
}
