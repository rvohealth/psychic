import { PsychicController } from '../../../../src'
import { Openapi } from '../../../../src/controller/decorators'
import User from '../../../../test-app/app/models/User'

describe('Openapi decorator', () => {
  context('params', () => {
    class MyController extends PsychicController {
      @Openapi(() => User, {
        path: '/users',
        method: 'get',
      })
      public show() {}
    }
  })
})
