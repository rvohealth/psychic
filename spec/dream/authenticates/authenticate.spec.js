import { create } from 'spec/factories'

describe('Dream#authenticate', () => {
  it ('registers authentication type and stores callback function in beforeSave to' +
    'ensure password column is encrypted', async () => {
    const TestUser = create('dream.testUser')
    const dream = new TestUser()
    const opts = {}
    const spy = posess(dream, 'authenticateFor').returning(true)
    dream.authenticate('email', 'password', opts)
    expect(spy).toHaveBeenCalledWith('email', 'password', opts)
  })

  context ('only one argument is passed', () => {
    it ('calls authenticateAll instead', async () => {
      const TestUser = create('dream.testUser')
      const dream = new TestUser()
      const spy = posess(dream, 'authenticateAll').returning(true)
      dream.authenticate('password')
      expect(spy).toHaveBeenCalledWith('password')
    })
  })
})


