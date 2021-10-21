import { create } from 'spec/factories'

describe('Dream#afterDestroy', () => {
  it ('stores callback in private array for later execution', async () => {
    const TestUser = create('dream.TestUser', {})
    const cb = () => {}
    const dream = new TestUser()
    dream.afterDestroy(cb)
    expect(dream.constructor._afterDestroy).toEqual([ cb ])
  })
})

