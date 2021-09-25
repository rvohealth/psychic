import { jest } from '@jest/globals'
import db from 'src/db'

describe('DB#dropTable drops column', () => {
  it ('passes dropTable to the underlying adapter', async () => {
    const spy = jest.fn()
    const adapterSpy = jest.spyOn(db, 'adapter', 'get').mockReturnValue({ dropTable: spy })
    await db.dropTable('users')
    expect(spy).toHaveBeenCalledWith('users')
    adapterSpy.mockRestore()
  })
})
