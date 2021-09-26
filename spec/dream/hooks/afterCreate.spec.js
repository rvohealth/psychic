import { create } from 'spec/factories'

describe('Dream#afterCreate', () => {
  it ('stores callback in private array for later execution', async () => {
    const TestUser = create('dream.TestUser', {})
    const cb = () => {}
    const dream = new TestUser()
    dream.afterCreate(cb)
    expect(dream._afterCreate).toEqual([ cb ])
  })
})

