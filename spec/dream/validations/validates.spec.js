import { create } from 'spec/factories'

describe('Dream#validates', () => {
  it ('calls to Query interface correctly, applying callbacks before and after', async () => {
    const TestUser = create('dream.TestUser')
    TestUser.validates('email', { unique: true })
    expect(TestUser._validations.email).toEqual([{ unique: true }])
  })
})
