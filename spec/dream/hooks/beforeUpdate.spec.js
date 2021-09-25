import { create } from 'spec/factories'

describe('Dream#beforeUpdate', () => {
  it ('stores callback in private array for later execution', async () => {
    const TestUser = create('dream.testUser', {})
    const cb = () => {}
    const dream = new TestUser()
    dream.beforeUpdate(cb)
    expect(dream._beforeUpdate).toEqual([ cb ])
  })
})

