import { jest } from '@jest/globals'
import db from 'src/db'
import Query from 'src/db/query'

describe('DB#select handles fullOuterJoin', () => {
  it ('passes join to the underlying adapter', async () => {
    const spy = jest.fn()
    const adapterSpy = jest.spyOn(Query.prototype, 'adapter', 'get').mockReturnValue({ select: spy })
    await db
      .select('email')
      .from('users')
      .fullOuterJoin('face_masks', 'face_masks.user_id = users.id')
      .do()
    expect(spy).toHaveBeenCalledWith(['email'], { from: 'users', join: [{
      table: 'face_masks',
      on: 'face_masks.user_id = users.id',
      type: 'full outer',
    }] })
    adapterSpy.mockRestore()
  })

  describe ('when on is ommited and options are passed instead', () => {
    it ('correctly parses on from options', async () => {
      const spy = jest.fn()
      const adapterSpy = jest.spyOn(Query.prototype, 'adapter', 'get').mockReturnValue({ select: spy })
      await db
        .select('email')
        .from('users')
        .fullOuterJoin('face_masks', { on: 'face_masks.user_id = users.id' })
        .do()
      expect(spy).toHaveBeenCalledWith(['email'], { from: 'users', join: [{
        table: 'face_masks',
        on: 'face_masks.user_id = users.id',
        type: 'full outer',
      }] })
      adapterSpy.mockRestore()
    })
  })
})
