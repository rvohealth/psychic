import { send } from '../../../spec-helpers'

describe('PsychicRouter', () => {
  describe('namespaced routes', () => {
    it('can direct a route to a nested controller path', async () => {
      const res = await send.get('/api-ping', 200)
      expect(res.body).toEqual('hellonestedworld')
    })
  })
})
