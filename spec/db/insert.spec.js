import { jest } from '@jest/globals'
import db from 'src/db'

describe('DB#insert drops column', () => {
  it ('passes insert to the underlying adapter', async () => {
    const spy = jest.fn()
    const adapterSpy = jest.spyOn(db, 'adapter', 'get').mockReturnValue({ insert: spy })
    await db.insert()
    expect(spy).toHaveBeenCalled()
    adapterSpy.mockRestore()
  })
})
