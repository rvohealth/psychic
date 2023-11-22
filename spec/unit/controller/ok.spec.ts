import { getMockReq, getMockRes } from '@jest-mock/express'
import { DreamSerializer, Attribute } from '@rvohealth/dream'
import PsychicController from '../../../src/controller'
import PsychicConfig from '../../../src/config'
import PsychicServer from '../../../src/server'
import User from '../../../test-app/app/models/User'
import { Request, Response } from 'express'
import { BeforeAction } from '../../../src/controller/decorators'

describe('PsychicController', () => {
  describe('#ok', () => {
    let req: Request
    let res: Response
    let server: PsychicServer
    let config: PsychicConfig

    class MyController extends PsychicController {
      public async howyadoin() {
        this.ok({ chalupas: 'dujour' })
      }
    }

    beforeEach(() => {
      req = getMockReq({ body: { search: 'abc' }, query: { cool: 'boyjohnson' } })
      res = getMockRes().res
      server = new PsychicServer()
      config = new PsychicConfig(server.app)
      jest.spyOn(res, 'json')
    })

    it('renders the data as json', async () => {
      const controller = new MyController(req, res, { config })
      await controller.howyadoin()
      expect(res.json).toHaveBeenCalledWith({ chalupas: 'dujour' })
    })

    context('when passed null', () => {
      class MyController extends PsychicController {
        public async howyadoin() {
          this.ok(null)
        }
      }

      it('passes "null" to json without raising exception', async () => {
        const controller = new MyController(req, res, { config })
        await controller.howyadoin()
        expect(res.json).toHaveBeenCalledWith(null)
      })
    })
  })
})
