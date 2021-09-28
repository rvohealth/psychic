import { create } from 'spec/factories'

describe('Dream#validates', () => {
  it ('calls to Query interface correctly, applying callbacks before and after', async () => {
    const TestUser = create('dream.TestUser')
    const user = new TestUser()
    user.validates('email', { unique: true })
    expect(user._validations.email).toEqual([{ unique: true }])
  })
})
