import { jest } from '@jest/globals'
import db from 'src/db'

describe('DB#hasColumn drops column', () => {
  it ('passes hasColumn to the underlying adapter', async () => {
    const spy = jest.fn()
    const adapterSpy = jest.spyOn(db, 'adapter', 'get').mockReturnValue({ hasColumn: spy })
    await db.hasColumn()
    expect(spy).toHaveBeenCalled()
    adapterSpy.mockRestore()
  })
})
