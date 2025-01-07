import { specRequest as request } from '@rvohealth/psychic-spec-helpers'
import { PsychicServer } from '../../../../src'

describe('a visitor attempts to hit a route that will trigger a 506', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 506', async () => {
    const res = await request.get('/variant-also-negotiates', 506)
    expect(res.body).toEqual('custom message')
  })
})
