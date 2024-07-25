import { getMockReq, getMockRes } from '@jest-mock/express'
import { Request, Response } from 'express'
import PsychicController from '../../../src/controller'
import { OpenAPI } from '../../../src/controller/decorators'
import Psyconf from '../../../src/psyconf'
import User from '../../../test-app/app/models/User'

describe('PsychicController', () => {
  describe('#respond', () => {
    let req: Request
    let res: Response
    let config: Psyconf

    class MyController extends PsychicController {
      @OpenAPI(() => User, {
        status: 201,
      })
      public create() {
        this.respond('created')
      }

      public update() {
        this.respond('updated')
      }
    }

    beforeEach(() => {
      req = getMockReq({ body: { search: 'abc' }, query: { cool: 'boyjohnson' } })
      res = getMockRes().res
      config = new Psyconf()
      jest.spyOn(res, 'json')
      jest.spyOn(res, 'status')
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
