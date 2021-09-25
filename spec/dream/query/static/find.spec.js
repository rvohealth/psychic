import Dream from 'src/dream'
import Query from 'src/db/query'

describe('Dream.all', () => {
  it ('calls to Query interface correctly', async () => {
    const query = new Query()
    posess(Query, 'new').returning(query)
    posess(Dream, 'table', 'get').returning('fishmen')
    const selectSpy = posess(query, 'select').returning(query)
    const fromSpy = posess(query, 'from').returning(query)
    const whereSpy = posess(query, 'where').returning(query)
    const firstSpy = posess(query, 'first').returning({ fish: 10 })

    const result = await Dream.find(10)
    expect(result).toEqual({ fish: 10 })

    expect(selectSpy).toHaveBeenCalledWith('*')
    expect(fromSpy).toHaveBeenCalledWith('fishmen')
    expect(whereSpy).toHaveBeenCalledWith({ id: 10 })
    expect(firstSpy).toHaveBeenCalled()
  })
})
