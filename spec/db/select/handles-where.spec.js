import { jest } from '@jest/globals'
import db from 'src/singletons/db'
import Query from 'src/db/query'

describe('DB#select handles where', () => {
  it ('passes off where to the underlying adapter', async () => {
    const spy = jest.fn()
    const adapterSpy = jest.spyOn(Query.prototype, 'adapter', 'get').mockReturnValue({ select: spy })
    await db
      .select('email')
      .from('users')
      .where({ email: 'cheeseball' })
      .do()
    expect(spy).toHaveBeenCalledWith(['email'], { from: 'users', where: { email: 'cheeseball' } })
    adapterSpy.mockRestore()
  })
})
