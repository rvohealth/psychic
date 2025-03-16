import { BeforeAction, PsychicController } from '../../../../../src/index.js'

export default class HelloController extends PsychicController {
  @BeforeAction()
  public myBeforeAction() {
    this.forbidden()
  }

  public hello() {
    this.created()
  }
}
