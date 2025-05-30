import { getMockReq, getMockRes } from '@jest-mock/express'
import { Request, Response } from 'express'
import PsychicController from '../../../src/controller/index.js'
import PsychicApp from '../../../src/psychic-app/index.js'

describe('PsychicController', () => {
  describe('#ok', () => {
    let req: Request
    let res: Response
    let config: PsychicApp

    class MyController extends PsychicController {
      public howyadoin() {
        this.ok({ chalupas: 'dujour' })
      }
    }

    beforeEach(() => {
      req = getMockReq({ body: { search: 'abc' }, query: { cool: 'boyjohnson' } }) as unknown as Request
      res = getMockRes().res as unknown as Response
      config = new PsychicApp()
      vi.spyOn(res, 'json')
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
