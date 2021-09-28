import { create } from 'spec/factories'

describe ('Dream#update', () => {
  it ('sets attributes and calls save', async () => {
    const TestUser = create('dream.TestUser')
    const dream = new TestUser()
    posess(dream, 'save').returning({ fish: 10 })
    const spy = posess(dream, 'setAttributes')

    const result = await dream.update({ email: 'fishman' })
    expect(dream.email).toEqual('fishman')
    expect(spy).toHaveBeenCalledWith({ email: 'fishman' })
    expect(result).toEqual({ fish: 10 })
  })
})
