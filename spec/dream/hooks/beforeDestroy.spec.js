import { create } from 'spec/factories'

describe('Dream#beforeDestroy', () => {
  it ('stores callback in private array for later execution', async () => {
    const TestUser = create('dream.TestUser', {})
    const cb = () => {}
    const dream = new TestUser()
    dream.beforeDestroy(cb)
    expect(dream.constructor._beforeDestroy).toEqual([ cb ])
  })
})

