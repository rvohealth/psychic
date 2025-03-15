import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import { PsychicServer } from '../../../../src.js'

describe('a visitor attempts to hit a route that will trigger a 422', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 422', async () => {
    const res = await request.get('/unprocessable-content', 422)
    expect(res.body).toEqual({ errors: { hello: ['world'] } })
  })
})
