import { send } from '../../../../spec-helpers'

describe('a visitor attempts to hit a non-existent route', () => {
  beforeEach(async () => {
    await send.init()
  })

  it('returns 404', async () => {
    await send.get('/non-existent-route', 404)
  })
})
