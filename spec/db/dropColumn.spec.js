import { jest } from '@jest/globals'
import db from 'src/db'

describe('DB#dropColumn drops column', () => {
  it ('passes dropColumn to the underlying adapter', async () => {
    const spy = jest.fn()
    const adapterSpy = jest.spyOn(db, 'adapter', 'get').mockReturnValue({ dropColumn: spy })
    await db.dropColumn('users', 'zimbo')
    expect(spy).toHaveBeenCalledWith('users', 'zimbo')
    adapterSpy.mockRestore()
  })
})
