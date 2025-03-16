import { getMockReq, getMockRes } from '@jest-mock/express'
import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import { Request, Response } from 'express'
import { BeforeAction } from '../../../src/controller/decorators.js'
import PsychicController from '../../../src/controller/index.js'
import { PsychicServer } from '../../../src/index.js'
import PsychicApplication from '../../../src/psychic-application/index.js'
import HelloController from '../../../test-app/src/app/controllers/BeforeActions/HelloController.js'
import GoodbyeController from '../../../test-app/src/app/controllers/BeforeActions/NestedBeforeAction/GoodbyeController.js'
import processDynamicallyDefinedControllers from '../../helpers/processDynamicallyDefinedControllers.js'

describe('PsychicController BeforeAction', () => {
  let req: Request
  let res: Response
  let config: PsychicApplication

  beforeEach(() => {
    req = getMockReq({ body: { search: 'abc' }, query: { cool: 'boyjohnson' } }) as unknown as Request
    res = getMockRes().res as unknown as Response
    config = new PsychicApplication()
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
  processDynamicallyDefinedControllers(MyController)

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
      processDynamicallyDefinedControllers(MyOtherController)

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

  context('a BeforeAction that emits a response', () => {
    beforeEach(async () => {
      await request.init(PsychicServer)
    })

    it('responds with the response emitted by the BeforAction', async () => {
      await request.get('/before-actions/hello', 403)
    })

    it('prevents the target action from being executed', async () => {
      const beforeActionSpy = vi.spyOn(HelloController.prototype, 'myBeforeAction').mockReturnValue()
      const spy = vi.spyOn(HelloController.prototype, 'hello')

      await request.get('/before-actions/hello', 201)
      expect(spy).toHaveBeenCalled()

      spy.mockReset()
      beforeActionSpy.mockRestore()
      await request.get('/before-actions/hello', 403)
      expect(spy).not.toHaveBeenCalled()
    })
  })

  context('a BeforeAction that overrides the same BeforeAction in an ancestor', () => {
    beforeEach(async () => {
      await request.init(PsychicServer)
    })

    context('that emits a response', () => {
      it('responds with the response status', async () => {
        await request.get('/before-actions/hello/world', 418)
      })

      it('prevents the target action from being executed', async () => {
        const beforeActionSpy = vi.spyOn(HelloController.prototype, 'myBeforeAction').mockReturnValue()
        const spy = vi.spyOn(HelloController.prototype, 'hello')

        await request.get('/before-actions/hello', 201)
        expect(spy).toHaveBeenCalled()

        spy.mockReset()
        beforeActionSpy.mockRestore()
        await request.get('/before-actions/hello', 403)
        expect(spy).not.toHaveBeenCalled()
      })

      context('when extended by another controller', () => {
        it('responds with the response status', async () => {
          await request.get('/before-actions/hello/goodbye', 418)
        })

        it('prevents the target action from being executed', async () => {
          const beforeActionSpy = vi.spyOn(GoodbyeController.prototype, 'myBeforeAction').mockReturnValue()
          const spy = vi.spyOn(GoodbyeController.prototype, 'goodbye')

          await request.get('/before-actions/hello/goodbye', 204)
          expect(spy).toHaveBeenCalled()

          spy.mockReset()
          beforeActionSpy.mockRestore()
          await request.get('/before-actions/hello/goodbye', 418)
          expect(spy).not.toHaveBeenCalled()
        })
      })
    })

    context('that throws an error', () => {
      it('responds with status 500', async () => {
        await request.get('/before-actions/hello/world-error', 500)
      })

      context('when extended by another controller', () => {
        it('responds with status 500', async () => {
          await request.get('/before-actions/hello/goodbye-error', 500)
        })
      })
    })
  })
})
