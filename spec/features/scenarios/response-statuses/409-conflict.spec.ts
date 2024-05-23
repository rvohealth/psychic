import { send } from '../../../../spec-helpers'

describe('a visitor attempts to hit a route that will trigger a 409', () => {
  beforeEach(async () => {
    await send.init()
  })

  it('returns 409', async () => {
    await send.get('/conflict', 409)
  })
})
