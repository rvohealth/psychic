import { create } from 'spec/factories'

describe('Dream#beforeSave', () => {
  it ('stores callback in private array for later execution', async () => {
    const TestUser = create('dream.TestUser', {})
    const cb = () => {}
    const dream = new TestUser()
    dream.beforeSave(cb)
    expect(dream.constructor._beforeSave).toEqual([ cb ])
  })
})

