import { getMockReq, getMockRes } from '@jest-mock/express'
import { Request, Response } from 'express'
import { MockInstance } from 'vitest'
import { OpenAPI } from '../../../src/controller/decorators.js'
import PsychicController from '../../../src/controller/index.js'
import * as toJsonModule from '../../../src/helpers/toJson.js'
import User from '../../../test-app/src/app/models/User.js'
import processDynamicallyDefinedControllers from '../../helpers/processDynamicallyDefinedControllers.js'

describe('PsychicController', () => {
  describe('#respond', () => {
    let req: Request
    let res: Response
    let toJsonSpy: MockInstance

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
      toJsonSpy = vi.spyOn(toJsonModule, 'default')
      vi.spyOn(res, 'status')
    })

    it('sets status and sends json', () => {
      const controller = new MyController(req, res, { action: 'create' })
      controller.create()
      expect(toJsonSpy).toHaveBeenCalledWith('created', false)

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(res.status).toHaveBeenCalledWith(201)
    })

    context('with no openapi decorator', () => {
      it('calls 200 status', () => {
        const controller = new MyController(req, res, { action: 'update' })
        controller.update()
        expect(toJsonSpy).toHaveBeenCalledWith('updated', false)

        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(res.status).toHaveBeenCalledWith(200)
      })
    })
  })
})
