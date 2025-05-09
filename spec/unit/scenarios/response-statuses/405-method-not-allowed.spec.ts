import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import { PsychicServer } from '../../../../src/index.js'

describe('a visitor attempts to hit a route that will trigger a 405', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 405', async () => {
    const res = await request.get('/method-not-allowed', 405)
    expect(res.body).toEqual('custom message')
  })
})
