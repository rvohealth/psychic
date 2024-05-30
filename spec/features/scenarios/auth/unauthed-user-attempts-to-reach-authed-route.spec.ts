import { specRequest as request } from '../../../../spec-helpers'

describe('a visitor attempts to hit an authed route (while being unauthenticated)', () => {
  beforeEach(async () => {
    await request.init()
  })

  it('returns 401', async () => {
    await request.get('/auth-ping', 401)
  })
})
