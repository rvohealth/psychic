import { getMockReq, getMockRes } from '@jest-mock/express'
import { Request, Response } from 'express'
import { BeforeAction } from '../../../src/controller/decorators.js'
import PsychicController from '../../../src/controller/index.js'
import processDynamicallyDefinedControllers from '../../helpers/processDynamicallyDefinedControllers.js'

describe('PsychicController BeforeAction', () => {
  let req: Request
  let res: Response

  beforeEach(() => {
    req = getMockReq({ body: { search: 'abc' }, query: { cool: 'boyjohnson' } }) as unknown as Request
    res = getMockRes().res as unknown as Response
  })

  class MyController extends PsychicController {
    public customValue: string
    public counter: number = 0

    public show() {
      if (!this.customValue) this.customValue = 'goodbye'
      this.ok(this.customValue)
    }

    @BeforeAction()
    public configure() {
      if (!this.customValue) this.customValue = 'hello'
    }

    @BeforeAction()
    public updateCounter() {
      this.counter += 1
    }
  }
  processDynamicallyDefinedControllers(MyController)

  it('is called before the action', async () => {
    const controller = new MyController(req, res, { action: 'show' })
    await controller.runAction('show')
    expect(controller.customValue).toEqual('hello')
  })

  context('in a controller that inherits from a controller', () => {
    class MyOtherController extends MyController {
      public customValue2: string

      public override show() {
        if (!this.customValue) this.customValue = 'goodbye'
        if (!this.customValue2) this.customValue2 = 'goodbye2'
        this.ok({ customValue: this.customValue, customValue2: this.customValue2 })
      }

      @BeforeAction()
      public configure2() {
        if (!this.customValue2) this.customValue2 = 'hello2'
      }
    }
    processDynamicallyDefinedControllers(MyOtherController)

    it('only calls a beforeAction once', async () => {
      const controller = new MyOtherController(req, res, { action: 'show' })
      await controller.runAction('show')
      expect(controller.counter).toEqual(1)
    })
  })

  context(
    'in a controller that inherits from a controller that also has a before action with a different name',
    () => {
      class MyOtherController extends MyController {
        public customValue2: string

        public override show() {
          if (!this.customValue) this.customValue = 'goodbye'
          if (!this.customValue2) this.customValue2 = 'goodbye2'
          this.ok({ customValue: this.customValue, customValue2: this.customValue2 })
        }

        @BeforeAction()
        public configure2() {
          if (!this.customValue2) this.customValue2 = 'hello2'
        }
      }
      processDynamicallyDefinedControllers(MyOtherController)

      it('still calls the before action in the ancestor', async () => {
        const controller = new MyOtherController(req, res, { action: 'show' })
        await controller.runAction('show')
        expect(controller.customValue).toEqual('hello')
      })

      it('is called before the action in the child', async () => {
        const controller = new MyOtherController(req, res, { action: 'show' })
        await controller.runAction('show')
        expect(controller.customValue2).toEqual('hello2')
      })
    },
  )
})
