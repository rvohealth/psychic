import { specRequest as request } from '@rvohealth/psychic-spec-helpers'
import { PsychicServer } from '../../../../src'

describe('a visitor attempts to hit a route that will trigger a 451', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 451', async () => {
    const res = await request.get('/unavailable-for-legal-reasons', 451)
    expect(res.body).toEqual('custom message')
  })
})
