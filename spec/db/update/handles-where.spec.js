import { jest } from '@jest/globals'
import db from 'src/db'
import Query from 'src/db/query'

describe('DB#update handles where', () => {
  it ('passes off where to the underlying adapter', async () => {
    const spy = jest.fn()
    const adapterSpy = jest.spyOn(Query.prototype, 'adapter', 'get').mockReturnValue({ update: spy })
    await db
      .update('users', { email: 'slimslam' })
      .where({ email: 'cheeseball' })
      .do()
    expect(spy).toHaveBeenCalledWith('users', { email: 'slimslam' }, { from: 'users', where: { email: 'cheeseball' } })
    adapterSpy.mockRestore()
  })
})
