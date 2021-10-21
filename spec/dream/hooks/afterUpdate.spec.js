import { create } from 'spec/factories'

describe('Dream#afterUpdate', () => {
  it ('stores callback in private array for later execution', async () => {
    const TestUser = create('dream.TestUser', {})
    const cb = () => {}
    const dream = new TestUser()
    dream.afterUpdate(cb)
    expect(dream.constructor._afterUpdate).toEqual([ cb ])
  })
})

