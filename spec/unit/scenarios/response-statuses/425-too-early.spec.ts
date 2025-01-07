import { specRequest as request } from '@rvohealth/psychic-spec-helpers'
import { PsychicServer } from '../../../../src'

describe('a visitor attempts to hit a route that will trigger a 425', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 425', async () => {
    const res = await request.get('/too-early', 425)
    expect(res.body).toEqual('custom message')
  })
})
