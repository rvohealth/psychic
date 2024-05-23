import { send } from '../../../spec-helpers'

describe('PsychicRouter', () => {
  beforeEach(async () => {
    await send.init()
  })

  describe('namespaced routes', () => {
    it('can direct a route to a nested controller path', async () => {
      const res = await send.get('/api-ping', 200)
      expect(res.body).toEqual('hellonestedworld')
    })
  })
})
