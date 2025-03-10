import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import { PsychicServer } from '../../../../src'

describe('a visitor attempts to hit a route that will trigger a 503', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 503', async () => {
    const res = await request.get('/service-unavailable', 503)
    expect(res.body).toEqual('custom message')
  })
})
