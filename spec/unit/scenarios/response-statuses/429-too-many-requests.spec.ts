import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import { PsychicServer } from '../../../../src'

describe('a visitor attempts to hit a route that will trigger a 429', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 429', async () => {
    const res = await request.get('/too-many-requests', 429)
    expect(res.body).toEqual('custom message')
  })
})
