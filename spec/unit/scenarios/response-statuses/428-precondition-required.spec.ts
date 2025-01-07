import { specRequest as request } from '@rvohealth/psychic-spec-helpers'
import { PsychicServer } from '../../../../src'

describe('a visitor attempts to hit a route that will trigger a 428', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 428', async () => {
    const res = await request.get('/precondition-required', 428)
    expect(res.body).toEqual('custom message')
  })
})
