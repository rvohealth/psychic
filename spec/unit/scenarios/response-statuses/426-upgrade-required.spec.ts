import { specRequest as request } from '@rvohealth/psychic-spec-helpers'
import { PsychicServer } from '../../../../src'

describe('a visitor attempts to hit a route that will trigger a 426', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 426', async () => {
    const res = await request.get('/upgrade-required', 426)
    expect(res.body).toEqual('custom message')
  })
})
