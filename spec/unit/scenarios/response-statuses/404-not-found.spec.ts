import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import { PsychicServer } from '../../../../src'

describe('a visitor attempts to hit a route that will trigger a 404', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 404', async () => {
    await request.get('/not-found', 404)
  })

  context('when a record is not found', () => {
    it('returns 404', async () => {
      await request.get('/record-not-found', 404)
    })
  })
})
