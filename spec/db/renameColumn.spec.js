import { jest } from '@jest/globals'
import db from 'src/singletons/db'

describe('DB#renameColumn', () => {
  it ('renames column', async () => {
    const spy = jest.fn()
    const adapterSpy = jest.spyOn(db, 'adapter', 'get').mockReturnValue({ renameColumn: spy })
    await db.renameColumn('users', 'zimbo', 'taco')
    expect(spy).toHaveBeenCalledWith('users', 'zimbo', 'taco')
    adapterSpy.mockRestore()
  })
})
