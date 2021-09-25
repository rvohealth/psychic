import { create } from 'spec/factories'

describe('Dream#beforeSave', () => {
  it ('stores callback in private array for later execution', async () => {
    const TestUser = create('dream.testUser', {})
    const cb = () => {}
    const dream = new TestUser()
    dream.beforeSave(cb)
    expect(dream._beforeSave).toEqual([ cb ])
  })
})

