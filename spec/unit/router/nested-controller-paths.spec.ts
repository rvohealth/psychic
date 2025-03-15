import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import { PsychicServer } from '../../../src.js'

describe('PsychicRouter', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  describe('namespaced routes', () => {
    it('can direct a route to a nested controller path', async () => {
      const res = await request.get('/api-ping', 200)
      expect(res.body).toEqual('hellonestedworld')
    })
  })
})
