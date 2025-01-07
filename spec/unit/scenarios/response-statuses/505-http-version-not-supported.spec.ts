import { specRequest as request } from '@rvohealth/psychic-spec-helpers'
import { PsychicServer } from '../../../../src'

describe('a visitor attempts to hit a route that will trigger a 505', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 505', async () => {
    const res = await request.get('/http-version-not-supported', 505)
    expect(res.body).toEqual('custom message')
  })
})
