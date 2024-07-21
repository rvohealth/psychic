import { getMockReq, getMockRes } from '@jest-mock/express'
import { Request, Response } from 'express'
import PsychicConfig from '../../../src/config'
import PsychicController from '../../../src/controller'
import { Openapi } from '../../../src/controller/decorators'
import PsychicServer from '../../../src/server'
import User from '../../../test-app/app/models/User'

describe('PsychicController', () => {
  describe('#respond', () => {
    let req: Request
    let res: Response
    let server: PsychicServer
    let config: PsychicConfig

    class MyController extends PsychicController {
      @Openapi(() => User, {
        path: '/users',
        method: 'post',
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
      server = new PsychicServer()
      config = new PsychicConfig(server.app)
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
