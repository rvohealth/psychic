import { BeforeAction } from '../../../src/controller/decorators'
import Params from '../../../src/server/params'
import User from '../models/User'
import ApplicationController from './ApplicationController'

@BeforeAction({
  only: ['authPing'],
  methodName: 'authenticate',
})
export default class GreeterController extends ApplicationController {
  public async show() {
    this.ok('must go on')
  }

  public async hello() {
    this.ok('goodbye')
  }
}
