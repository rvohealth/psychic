import request from '../../../spec-helpers/spec-request'

describe('PsychicRouter', () => {
  beforeEach(async () => {
    await request.init()
  })

  describe('namespaced routes', () => {
    it('can direct a route to a nested controller path', async () => {
      const res = await request.get('/api-ping', 200)
      expect(res.body).toEqual('hellonestedworld')
    })
  })
})
