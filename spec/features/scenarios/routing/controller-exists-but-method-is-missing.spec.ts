import { send } from '../../../../spec-helpers'

describe('a visitor attempts to hit a route where the controller exists, but the method on the controller does not', () => {
  beforeEach(async () => {
    await send.init()
  })

  it('returns 501', async () => {
    await send.get('/controller-exists-but-method-doesnt', 501)
  })
})
