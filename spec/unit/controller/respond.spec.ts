import { getMockReq, getMockRes } from '@jest-mock/express'
import { Request, Response } from 'express'
import { OpenAPI } from '../../../src/controller/decorators.js'
import PsychicController from '../../../src/controller/index.js'
import PsychicApplication from '../../../src/psychic-application/index.js'
import User from '../../../test-app/src/app/models/User.js'
import processDynamicallyDefinedControllers from '../../helpers/processDynamicallyDefinedControllers.js'

describe('PsychicController', () => {
  describe('#respond', () => {
    let req: Request
    let res: Response
    let config: PsychicApplication

    class MyController extends PsychicController {
      @OpenAPI(User, {
        status: 201,
      })
      public create() {
        this.respond('created')
      }

      public update() {
        this.respond('updated')
      }
    }
    processDynamicallyDefinedControllers(MyController)

    beforeEach(() => {
      req = getMockReq({ body: { search: 'abc' }, query: { cool: 'boyjohnson' } }) as unknown as Request
      res = getMockRes().res as unknown as Response
      config = new PsychicApplication()
      vi.spyOn(res, 'json')
      vi.spyOn(res, 'status')
    })

    it('sets status and sends json', () => {
      const controller = new MyController(req, res, { config, action: 'create' })
      controller.create()
      expect(res.json).toHaveBeenCalledWith('created')

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(res.status).toHaveBeenCalledWith(201)
    })

    context('with no openapi decorator', () => {
      it('calls 200 status', () => {
        const controller = new MyController(req, res, { config, action: 'update' })
        controller.update()
        expect(res.json).toHaveBeenCalledWith('updated')

        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(res.status).toHaveBeenCalledWith(200)
      })
    })
  })
})
