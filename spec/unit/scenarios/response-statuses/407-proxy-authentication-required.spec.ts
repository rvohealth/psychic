import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import { PsychicServer } from '../../../../src'

describe('a visitor attempts to hit a route that will trigger a 407', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 407', async () => {
    const res = await request.get('/proxy-authentication-required', 407)
    expect(res.body).toEqual('custom message')
  })
})
