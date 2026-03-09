import PsychicController from '../../../src/controller/index.js'
import { createMockKoaContext } from './helpers/mockRequest.js'

describe('PsychicController', () => {
  describe('#header', () => {
    it('returns the result of calling this.ctx.header.get', () => {
      const ctx = createMockKoaContext()
      const spy = vi.spyOn(ctx.request, 'get').mockReturnValue('abc123')
      const controller = new PsychicController(ctx, { action: 'hello' })
      expect(controller.header('MyHeader')).toEqual('abc123')
      expect(spy).toHaveBeenCalledExactlyOnceWith('MyHeader')
    })
  })
})
