import { getMockReq, getMockRes } from '@jest-mock/express'
import PsychicController from '../../../src/controller'
import PsychicConfig from '../../../src/config'
import PsychicServer from '../../../src/server'
import { Request, Response } from 'express'

describe('PsychicController', () => {
  describe('#ok', () => {
    let req: Request
    let res: Response
    let server: PsychicServer
    let config: PsychicConfig

    class MyController extends PsychicController {
      public howyadoin() {
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

    it('renders the data as json', () => {
      const controller = new MyController(req, res, { config, action: 'howyadoin' })
      controller.howyadoin()
      expect(res.json).toHaveBeenCalledWith({ chalupas: 'dujour' })
    })

    context('when passed null', () => {
      class MyController extends PsychicController {
        public howyadoin() {
          this.ok(null)
        }
      }

      it('passes "null" to json without raising exception', () => {
        const controller = new MyController(req, res, { config, action: 'howyadoin' })
        controller.howyadoin()
        expect(res.json).toHaveBeenCalledWith(null)
      })
    })
  })
})
