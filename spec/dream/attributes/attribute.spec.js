import { create } from 'spec/factories'

describe('Dream#attribute', () => {
  it ('registers authentication type and stores callback function in beforeSave to' +
    'ensure password column is encrypted', async () => {
    const TestUser = create('dream.TestUser')
    const dream = new TestUser()
    dream.email = 'fishman'
    expect(dream.attribute('email')).toEqual('fishman')
  })
})
