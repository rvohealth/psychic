import { BeforeAction } from '../../../src/controller/decorators'
import ApplicationController from './ApplicationController'

@BeforeAction({
  only: ['authPing'],
  methodName: 'authenticate',
})
export default class ScopeTestController extends ApplicationController {
  public scopeTest() {
    this.ok('helloscopedworld')
  }
}
