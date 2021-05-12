import { jest } from '@jest/globals'
import db from 'src/db'

describe('DB#changeDefault', () => {
  it ('renames column', async () => {
    const spy = jest.fn()
    const adapterSpy = jest.spyOn(db, 'adapter', 'get').mockReturnValue({ changeDefault: spy })
    await db.changeDefault('users', 'zimbo', 'taco')
    expect(spy).toHaveBeenCalledWith('users', 'zimbo', 'taco')
    adapterSpy.mockRestore()
  })
})
