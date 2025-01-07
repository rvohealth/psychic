import { specRequest as request } from '@rvohealth/psychic-spec-helpers'
import { PsychicServer } from '../../../../src'

describe('a visitor attempts to hit a route that will trigger a 408', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 408', async () => {
    const res = await request.get('/request-timeout', 408)
    expect(res.body).toEqual('custom message')
  })
})
