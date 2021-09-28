import { create } from 'spec/factories'

describe ('Dream#setAttributes', () => {
  it ('sets attributes', async () => {
    const TestUser = create('dream.TestUser')
    const dream = new TestUser()
    dream.setAttributes({ email: 'fishman' })
    expect(dream.email).toEqual('fishman')
  })
})
