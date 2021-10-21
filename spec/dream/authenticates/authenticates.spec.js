import { create } from 'spec/factories'

describe('Dream#authenticates', () => {
  it ('registers authentication type and stores callback function in beforeSave to' +
    'ensure password column is encrypted', async () => {
    const TestUser = create('dream.TestUser', {})
    const dream = new TestUser()
    const opts = {}
    const spy = posess(TestUser, 'beforeSave').returning(true)
    TestUser.authenticates('email', 'password', opts)
    expect(dream._authentications.db['email::password'].identifyingColumn).toBe('email')
    expect(dream._authentications.db['email::password'].passwordColumn).toBe('password')

    // would like to use CalledWith here, but behavior covered by feature specs
    expect(spy).toHaveBeenCalled()
  })
})


