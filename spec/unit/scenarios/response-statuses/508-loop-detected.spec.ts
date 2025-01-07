import { specRequest as request } from '@rvohealth/psychic-spec-helpers'
import { PsychicServer } from '../../../../src'

describe('a visitor attempts to hit a route that will trigger a 508', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 508', async () => {
    const res = await request.get('/loop-detected', 508)
    expect(res.body).toEqual('custom message')
  })
})
