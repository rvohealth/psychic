import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import { PsychicServer } from '../../../../src.js'

describe('a visitor attempts to hit a route that will trigger a 502', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 502', async () => {
    const res = await request.get('/bad-gateway', 502)
    expect(res.body).toEqual('custom message')
  })
})
