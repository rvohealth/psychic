import Dream from 'src/dream'
import Query from 'src/db/query'

describe('Dream.all', () => {
  it ('calls to Query interface correctly', async () => {
    const query = new Query()
    posess(Query, 'new').returning(query)
    posess(Dream, 'table', 'get').returning('fishmen')
    const selectSpy = posess(query, 'select').returning(query)
    const fromSpy = posess(query, 'from').returning(query)
    const allSpy = posess(query, 'all').returning({ fish: 10 })

    const result = await Dream.all()
    expect(result).toEqual({ fish: 10 })
    expect(selectSpy).toHaveBeenCalledWith('*')
    expect(fromSpy).toHaveBeenCalledWith('fishmen')
    expect(allSpy).toHaveBeenCalled()
  })
})
