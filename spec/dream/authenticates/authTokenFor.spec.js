import jwt from 'jsonwebtoken'
import { create } from 'spec/factories'

describe('Dream#authTokenFor', () => {
  it ('', async () => {
    const TestUser = create('dream.TestUser')
    const dream = new TestUser()
    const spy = posess(jwt, 'sign').returning({ fish: 10 })
    dream.id = 12345

    const result = await dream.authTokenFor('email:password')
    expect(spy).toHaveBeenCalledWith({
      key: 'email:password',
      dreamClass: 'TestUser',
      id: 12345,
    }, 'black cats are the coolest')
    expect(result).toEqual({ fish: 10 })
  })
})
