import { specRequest as request } from '@rvohealth/psychic-spec-helpers'
import { PsychicServer } from '../../../../src'

describe('a visitor attempts to hit a route that will trigger a 416', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 416', async () => {
    const res = await request.get('/range-not-satisfiable', 416)
    expect(res.body).toEqual('custom message')
  })
})
