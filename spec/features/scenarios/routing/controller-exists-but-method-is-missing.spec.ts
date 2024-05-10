import { send } from '../../../../spec-helpers'

describe('a visitor attempts to hit an unauthed route', () => {
  it('returns 501', async () => {
    await send.get('/controller-exists-but-method-doesnt', 501)
  })
})
