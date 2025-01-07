import { specRequest as request } from '@rvohealth/psychic-spec-helpers'
import { PsychicServer } from '../../../../src'

describe('a visitor attempts to hit a route that will trigger a 511', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 511', async () => {
    const res = await request.get('/network-authentication-required', 511)
    expect(res.body).toEqual('custom message')
  })
})
