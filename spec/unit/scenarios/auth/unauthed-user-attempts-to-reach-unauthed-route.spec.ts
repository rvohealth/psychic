import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import { PsychicServer } from '../../../../src/package-exports/index.js'

describe('a visitor attempts to hit an unauthed route', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('accepts the request', async () => {
    await request.get('/ping', 200)
  })
})
