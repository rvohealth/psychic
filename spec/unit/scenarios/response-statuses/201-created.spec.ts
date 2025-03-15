import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import { PsychicServer } from '../../../../src.js'

describe('a visitor attempts to hit a route that will respond with a 201', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 201', async () => {
    const res = await request.get('/created', 201)
    expect(res.body).toEqual('custom content')
  })
})
