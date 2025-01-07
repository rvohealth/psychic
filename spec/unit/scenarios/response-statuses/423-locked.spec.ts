import { specRequest as request } from '@rvohealth/psychic-spec-helpers'
import { PsychicServer } from '../../../../src'

describe('a visitor attempts to hit a route that will trigger a 423', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 423', async () => {
    const res = await request.get('/locked', 423)
    expect(res.body).toEqual('custom message')
  })
})
