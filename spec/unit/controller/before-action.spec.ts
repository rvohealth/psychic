import { getMockReq, getMockRes } from '@jest-mock/express'
import { Request, Response } from 'express'
import PsychicController from '../../../src/controller'
import { BeforeAction } from '../../../src/controller/decorators'
import Psyconf from '../../../src/psyconf'

describe('PsychicController BeforeAction', () => {
  let req: Request
  let res: Response
  let config: Psyconf

  beforeEach(() => {
    req = getMockReq({ body: { search: 'abc' }, query: { cool: 'boyjohnson' } })
    res = getMockRes().res
    config = new Psyconf()
  })

  class MyController extends PsychicController {
    public customValue: string

    public show() {
      if (!this.customValue) this.customValue = 'goodbye'
      this.ok(this.customValue)
    }

    @BeforeAction()
    public configure() {
      if (!this.customValue) this.customValue = 'hello'
    }
  }

  it('is called before the action', async () => {
    const controller = new MyController(req, res, { config, action: 'show' })
    await controller.runAction('show')
    expect(controller.customValue).toEqual('hello')
  })

  context(
    'in a controller that inherits from a controller that also has a before action with a different name',
    () => {
      class MyOtherController extends MyController {
        public customValue2: string

        public show() {
          if (!this.customValue) this.customValue = 'goodbye'
          if (!this.customValue2) this.customValue2 = 'goodbye2'
          this.ok({ customValue: this.customValue, customValue2: this.customValue2 })
        }

        @BeforeAction()
        public configure2() {
          if (!this.customValue2) this.customValue2 = 'hello2'
        }
      }

      it('still calls the before action in the ancestor', async () => {
        const controller = new MyOtherController(req, res, { config, action: 'show' })
        await controller.runAction('show')
        expect(controller.customValue).toEqual('hello')
      })

      it('is called before the action in the child', async () => {
        const controller = new MyOtherController(req, res, { config, action: 'show' })
        await controller.runAction('show')
        expect(controller.customValue2).toEqual('hello2')
      })
    },
  )
})
