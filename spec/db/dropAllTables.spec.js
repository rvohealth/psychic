import { jest } from '@jest/globals'
import db from 'src/db'

describe('DB#dropAllTables drops column', () => {
  it ('passes dropAllTables to the underlying adapter', async () => {
    const spy = jest.fn()
    const adapterSpy = jest.spyOn(db, 'adapter', 'get').mockReturnValue({ dropAllTables: spy })
    await db.dropAllTables()
    expect(spy).toHaveBeenCalled()
    adapterSpy.mockRestore()
  })
})
