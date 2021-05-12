import { jest } from '@jest/globals'
import db from 'src/db'

describe('DB#addColumn adds column', () => {
  it ('passes fetch to the underlying adapter', async () => {
    const spy = jest.fn()
    const adapterSpy = jest.spyOn(db, 'adapter', 'get').mockReturnValue({ addColumn: spy })
    await db.addColumn('users', 'zimbo', 'text', { primary: true })
    expect(spy).toHaveBeenCalledWith('users', 'zimbo', 'text', { primary: true })
    adapterSpy.mockRestore()
  })
})
