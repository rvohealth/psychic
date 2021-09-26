import { create } from 'spec/factories'

describe('Dream#authenticateAll', () => {
  it ('calls authenticateFor, passing null for identifyingColumn', async () => {
    const TestUser = create('dream.TestUser')
    const dream = new TestUser()
    const spy = posess(dream, 'authenticateFor').returning(true)
    dream.authenticateAll('password')
    expect(spy).toHaveBeenCalledWith(null, 'password', undefined)
  })
})
