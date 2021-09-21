import db from 'src/singletons/db'
import Query from 'src/db/query'

describe('DB#delete', () => {
  it ('instantiates new query, calling delete upon it', async () => {
    const mockQuery = new Query()

    posess(Query, 'new').returning(mockQuery)
    const spy = posess(mockQuery, 'delete').returning({ fish: 20 })

    const result = await db.delete('users')

    expect(spy).toHaveBeenCalledWith('users')
    expect(result).toEqual({ fish: 20 })
  })
})
