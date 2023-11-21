import { getMockReq, getMockRes } from '@jest-mock/express'
import PsychicController from '../../../src/controller'
import PsychicConfig from '../../../src/config'
import PsychicServer from '../../../src/server'

describe('PsychicController', () => {
  describe('get #params', () => {
    it('returns both body and url-decoded query params', () => {
      const req = getMockReq({
        body: { search: 'abc' },
        query: { food: encodeURIComponent('common:steak & eggs'), nullfield: null as any },
      })
      const res = getMockRes().res
      const server = new PsychicServer()
      const controller = new PsychicController(req, res, { config: new PsychicConfig(server.app) })

      expect(controller.params.search).toEqual('abc')
      expect(controller.params.food).toEqual('common:steak & eggs')
      expect(controller.params.nullfield).toEqual('null')
    })
  })
})
