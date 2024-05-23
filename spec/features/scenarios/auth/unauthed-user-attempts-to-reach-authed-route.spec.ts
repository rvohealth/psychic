import { send } from '../../../../spec-helpers'

describe('a visitor attempts to hit an authed route (while being unauthenticated)', () => {
  beforeEach(async () => {
    await send.init()
  })

  it('returns 401', async () => {
    await send.get('/auth-ping', 401)
  })
})
