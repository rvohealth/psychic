import Koa from 'koa'
import PsychicController from '../../../src/controller/index.js'
import { createMockKoaContext } from './helpers/mockRequest.js'

describe('PsychicController', () => {
  describe('get #params', () => {
    it('returns both body and query params', () => {
      const ctx = createMockKoaContext({
        body: { search: 'abc' },
        query: { cool: 'boyjohnson' },
      })
      const controller = new PsychicController(ctx, { action: 'hello' })

      expect(controller.params.search).toEqual('abc')
      expect(controller.params.cool).toEqual('boyjohnson')
    })
  })
})
