import WorldErrorController from './WorldErrorController.js'

export default class GoodbyeErrorController extends WorldErrorController {
  public goodbye() {
    this.noContent()
  }
}
