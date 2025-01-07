import { specRequest as request } from '@rvohealth/psychic-spec-helpers'
import { PsychicServer } from '../../../../src'

describe('a visitor attempts to hit a route that will trigger a 411', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 411', async () => {
    const res = await request.get('/length-required', 411)
    expect(res.body).toEqual('custom message')
  })
})
