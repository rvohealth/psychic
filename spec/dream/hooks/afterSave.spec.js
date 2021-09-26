import { create } from 'spec/factories'

describe('Dream#afterSave', () => {
  it ('stores callback in private array for later execution', async () => {
    const TestUser = create('dream.TestUser', {})
    const cb = () => {}
    const dream = new TestUser()
    dream.afterSave(cb)
    expect(dream._afterSave).toEqual([ cb ])
  })
})

