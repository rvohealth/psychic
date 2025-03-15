import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import { PsychicServer } from '../../../../src.js'

describe('a visitor attempts to hit a route that will trigger a 417', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 417', async () => {
    const res = await request.get('/expectation-failed', 417)
    expect(res.body).toEqual('custom message')
  })
})
