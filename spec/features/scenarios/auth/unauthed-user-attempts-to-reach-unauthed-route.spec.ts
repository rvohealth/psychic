import { specRequest as request } from '@rvohealth/psychic-spec-helpers'
import { PsychicServer } from '../../../../src'

describe('a visitor attempts to hit an unauthed route', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('accepts the request', async () => {
    await request.get('/ping', 200)
  })
})
