import { getMockReq, getMockRes } from '@jest-mock/express'
import PsychicController from '../../../src/controller'
import PsychicConfig from '../../../src/config'
import PsychicServer from '../../../src/server'
import User from '../../../test-app/app/models/User'
import { Params } from '../../../src'

describe('PsychicController', () => {
  describe('get #params', () => {
    it('returns both body and query params', () => {
      const req = getMockReq({ body: { search: 'abc' }, query: { cool: 'boyjohnson' } })
      const res = getMockRes().res
      const server = new PsychicServer()
      const controller = new PsychicController(req, res, { config: new PsychicConfig(server.app) })

      expect(controller.params.search).toEqual('abc')
      expect(controller.params.cool).toEqual('boyjohnson')
    })
  })

  describe('#castParam', () => {
    let controller: PsychicController

    beforeEach(() => {
      const req = getMockReq({
        body: { id: 1, name: 'howyadoin', createdAt: 'hello', updatedAt: 'birld', deletedAt: 'sometimeago' },
      })
      const res = getMockRes().res
      const server = new PsychicServer()
      controller = new PsychicController(req, res, { config: new PsychicConfig(server.app) })
    })

    it('returns the result of Params.cast', () => {
      jest.spyOn(Params, 'cast').mockReturnValue('chalupas dujour')
      expect(controller.castParam('name', 'string')).toEqual('chalupas dujour')
    })
  })

  describe('#paramsFor', () => {
    it('returns filtered params', () => {
      const req = getMockReq({
        body: { id: 1, name: 'howyadoin', createdAt: 'hello', updatedAt: 'birld', deletedAt: 'sometimeago' },
      })
      const res = getMockRes().res
      const server = new PsychicServer()
      const controller = new PsychicController(req, res, { config: new PsychicConfig(server.app) })

      expect(controller.paramsFor(User)).toEqual({ name: 'howyadoin' })
    })

    context('with a key passed', () => {
      it('drills into the params via the provided key', () => {
        const req = getMockReq({
          body: {
            user: {
              id: 1,
              name: 'howyadoin',
              createdAt: 'hello',
              updatedAt: 'birld',
              deletedAt: 'sometimeago',
            },
          },
        })
        const res = getMockRes().res
        const server = new PsychicServer()
        const controller = new PsychicController(req, res, { config: new PsychicConfig(server.app) })

        expect(controller.paramsFor(User, 'user')).toEqual({ name: 'howyadoin' })
      })
    })
  })
})
