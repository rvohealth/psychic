import ApplicationController from './ApplicationController'

export default class BackgroundTestController extends ApplicationController {
  public static async doSomething() {
    await this.background('doSomethingInBackground', 1, '2')
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public static async doSomethingInBackground(arg1: number, arg2: string) {}
}
