import HowlController from '../../../src/controller'

export default class BackgroundTestController extends HowlController {
  public static async doSomething() {
    this.background('doSomethingInBackground', 1, '2')
  }

  public static async doSomethingInBackground(arg1: number, arg2: string) {}
}
