import { specRequest as request } from '@rvohealth/psychic-spec-helpers'
import { PsychicServer } from '../../../../src'

describe('a visitor attempts to hit a route that will trigger a 431', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 431', async () => {
    const res = await request.get('/request-header-fields-too-large', 431)
    expect(res.body).toEqual('custom message')
  })
})
