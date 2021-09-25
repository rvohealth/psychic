import { create } from 'spec/factories'

describe('Dream#beforeCreate', () => {
  it ('stores callback in private array for later execution', async () => {
    const TestUser = create('dream.testUser', {})
    const cb = () => {}
    const dream = new TestUser()
    dream.beforeCreate(cb)
    expect(dream._beforeCreate).toEqual([ cb ])
  })
})

