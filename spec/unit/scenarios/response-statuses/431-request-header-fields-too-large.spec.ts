import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import { PsychicServer } from '../../../../src.js'

describe('a visitor attempts to hit a route that will trigger a 431', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 431', async () => {
    const res = await request.get('/request-header-fields-too-large', 431)
    expect(res.body).toEqual('custom message')
  })
})
