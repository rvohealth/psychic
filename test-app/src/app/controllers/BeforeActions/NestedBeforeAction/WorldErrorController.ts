import { BeforeAction } from '../../../../../../src/index.js'
import HelloController from '../HelloController.js'

export default class WorldErrorController extends HelloController {
  @BeforeAction()
  public override myBeforeAction() {
    throw new Error('This is an intentional error')
  }

  public world() {
    this.ok()
  }
}
