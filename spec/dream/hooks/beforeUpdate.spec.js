import { create } from 'spec/factories'

describe('Dream#beforeUpdate', () => {
  it ('stores callback in private array for later execution', async () => {
    const TestUser = create('dream.TestUser', {})
    const cb = () => {}
    const dream = new TestUser()
    dream.beforeUpdate(cb)
    expect(dream.constructor._beforeUpdate).toEqual([ cb ])
  })
})

