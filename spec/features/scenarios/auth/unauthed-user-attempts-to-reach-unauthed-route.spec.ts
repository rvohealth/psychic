import { send } from '../../../../spec-helpers'

describe('a visitor attempts to hit an unauthed route', () => {
  beforeEach(async () => {
    await send.init()
  })

  it('accepts the request', async () => {
    await send.get('/ping', 200)
  })
})
