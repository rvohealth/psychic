import { describe as context } from '@jest/globals'
import { getMockReq, getMockRes } from '@jest-mock/express'
import { Request, Response } from 'express'
import PsychicController from '../../../src/controller'
import PsychicApplication from '../../../src/psychic-application'

describe('PsychicController', () => {
  describe('#ok', () => {
    let req: Request
    let res: Response
    let config: PsychicApplication

    class MyController extends PsychicController {
      public howyadoin() {
        this.ok({ chalupas: 'dujour' })
      }
    }

    beforeEach(() => {
      req = getMockReq({ body: { search: 'abc' }, query: { cool: 'boyjohnson' } })
      res = getMockRes().res
      config = new PsychicApplication()
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
