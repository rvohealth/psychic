import { jest } from '@jest/globals'
import db from 'src/singletons/db'

describe('DB#renameTable', () => {
  it ('renames table', async () => {
    const spy = jest.fn()
    const adapterSpy = jest.spyOn(db, 'adapter', 'get').mockReturnValue({ renameTable: spy })
    await db.renameTable('users', 'bruisers')
    expect(spy).toHaveBeenCalledWith('users', 'bruisers')
    adapterSpy.mockRestore()
  })
})
